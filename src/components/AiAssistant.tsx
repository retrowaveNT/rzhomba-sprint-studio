import { ArrowUp, Paperclip, RotateCcw, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { StatePanel } from "@/components/rz";
import { fmtLong, useStore, type Task } from "@/lib/store";
import { cn, plural } from "@/lib/utils";

interface Proposal {
  taskId: string;
  taskKey: string;
  items: { title: string; hint?: string }[];
  applied: boolean;
}

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  time: string;
  proposal?: Proposal;
  error?: boolean;
  retryText?: string;
  feedback?: "up" | "down";
}

const HINTS: Record<string, string> = {
  c3: "Сериализация, восстановление после обновления, сброс параметров.",
  c4: "Tab / Esc, порядок фокуса, тесты логики И / ИЛИ.",
};

const QUICK = ["Сгенерировать описание", "Разбить на подзадачи", "Оценить задачу"];

function now() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function reply(
  q: string,
  task: Task | null,
  sprintStats: { done: number; total: number; pts: number; donePts: number; name: string } | null,
): Pick<Message, "text" | "proposal"> {
  const text = q.toLowerCase();
  const pending = task?.checklist.filter((c) => !c.done) ?? [];

  if (/подзадач|разбе|разбить/.test(text)) {
    if (!task) return { text: "Откройте задачу или добавьте её в контекст — тогда я разобью её на подзадачи." };
    if (pending.length === 0)
      return { text: `В ${task.key} нет незакрытых критериев — разбивать нечего.` };
    const n = pending.length;
    return {
      text: `Предлагаю ${n} ${plural(n, ["подзадачу", "подзадачи", "подзадач"])}. Родительская оценка ${task.points} SP и статус не изменятся.`,
      proposal: {
        taskId: task.id,
        taskKey: task.key,
        applied: false,
        items: pending.map((c) => ({ title: c.text, hint: HINTS[c.id] })),
      },
    };
  }
  if (/осталось|закрыть/.test(text)) {
    if (!task) return { text: "Выберите задачу — и я скажу, что осталось сделать." };
    if (pending.length === 0)
      return { text: `В ${task.key} все критерии выполнены. Можно переводить задачу в «Готово».` };
    return {
      text: `В ${task.key} осталось ${pending.length} ${plural(pending.length, ["критерий", "критерия", "критериев"])}:\n${pending
        .map((c, i) => `${i + 1}. ${c.text}`)
        .join("\n")}${task.due ? `\n\nСрок — ${fmtLong(task.due)}.` : ""}`,
    };
  }
  if (/описани/.test(text)) {
    if (!task) return { text: "Откройте задачу — я подготовлю черновик описания." };
    return {
      text: `Черновик описания для ${task.key}:\n\nЦель: ${task.title.toLowerCase()}.\nКритерии готовности: ${
        task.checklist.length > 0 ? task.checklist.map((c) => c.text.toLowerCase()).join("; ") : "уточнить с командой"
      }.\nОценка: ${task.points} SP.`,
    };
  }
  if (/оцен/.test(text)) {
    if (!task) return { text: "Откройте задачу — и я оценю её объём." };
    const left = pending.length;
    return {
      text: `${task.key}: текущая оценка — ${task.points} SP. Осталось критериев: ${left}. ${
        left > 2
          ? "Объём выглядит больше оценки — стоит разбить задачу."
          : "Оценка выглядит разумной для оставшегося объёма."
      }`,
    };
  }
  if (/план проверки|проверк/.test(text)) {
    if (!task) return { text: "Откройте задачу — и я составлю план проверки." };
    const steps = (pending.length > 0 ? pending : task.checklist).map((c, i) => `${i + 1}. Проверить: ${c.text.toLowerCase()}`);
    return { text: `План проверки ${task.key}:\n${steps.join("\n") || "1. Пройти основной сценарий вручную"}` };
  }
  if (/спринт/.test(text) && sprintStats) {
    const pct = sprintStats.pts ? Math.round((sprintStats.donePts / sprintStats.pts) * 100) : 0;
    return {
      text: `${sprintStats.name}: готово ${sprintStats.done} из ${sprintStats.total} задач, ${sprintStats.donePts} из ${sprintStats.pts} SP (${pct}%).`,
    };
  }
  return {
    text: "Могу разбить задачу на подзадачи, составить описание или план проверки, оценить объём и рассказать, что осталось до закрытия.",
  };
}

export function AiAssistant() {
  const { setAiOpen, project, contextTaskId, allTasks, activeSprint, tasks, columns, applySubtasks } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [dropTask, setDropTask] = useState(false);
  const [dropSprint, setDropSprint] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const bottom = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);

  const task = dropTask ? null : (allTasks.find((t) => t.id === contextTaskId) ?? null);
  const doneIds = new Set(columns.filter((c) => c.type === "done").map((c) => c.id));
  const sprintStats =
    activeSprint && !dropSprint
      ? (() => {
          const list = tasks.filter((t) => t.sprintId === activeSprint.id);
          const dn = list.filter((t) => doneIds.has(t.status));
          return {
            name: activeSprint.name,
            total: list.length,
            done: dn.length,
            pts: list.reduce((a, t) => a + t.points, 0),
            donePts: dn.reduce((a, t) => a + t.points, 0),
          };
        })()
      : null;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const ask = (raw: string, isRetry = false) => {
    const text = raw.trim();
    if (!text || typing) return;
    if (!isRetry) {
      setMessages((m) => [...m, { id: ++idRef.current, role: "user", text, time: now() }]);
    }
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setMessages((m) => [
          ...m.filter((x) => !x.error),
          {
            id: ++idRef.current,
            role: "ai",
            text: "Не удалось загрузить ответ ИИ.",
            time: now(),
            error: true,
            retryText: text,
          },
        ]);
        return;
      }
      const r = reply(text, task, sprintStats);
      setMessages((m) => [
        ...m.filter((x) => !x.error),
        { id: ++idRef.current, role: "ai", text: r.text, time: now(), proposal: r.proposal },
      ]);
    }, 700);
  };

  const apply = (msgId: number) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg?.proposal || msg.proposal.applied) return;
    applySubtasks(msg.proposal.taskId, msg.proposal.items.map((i) => i.title));
    setMessages((all) =>
      all.map((m) => (m.id === msgId && m.proposal ? { ...m, proposal: { ...m.proposal, applied: true } } : m)),
    );
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Скопировано");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const chip =
    "inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground";

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card" aria-label="ИИ-ассистент">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-[15px] font-semibold">ИИ-ассистент</h2>
        <div className="ml-auto flex items-center gap-0.5 text-muted-foreground">
          <button
            onClick={() => setMessages([])}
            aria-label="Начать новый диалог"
            className="rounded p-1.5 hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setAiOpen(false)}
            aria-label="Закрыть ассистента"
            className="rounded p-1.5 hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="px-4 pb-3 text-[11px] text-muted-foreground">{project.name} · текущий диалог</p>

      <div className="border-y border-border px-4 py-3">
        <p className="eyebrow mb-2 text-muted-foreground">Контекст · виден только в этом диалоге</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {task && (
            <span className={chip}>
              {task.key}
              <button aria-label="Убрать задачу из контекста" onClick={() => setDropTask(true)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {sprintStats && activeSprint && (
            <span className={chip}>
              {activeSprint.name}
              <button aria-label="Убрать спринт из контекста" onClick={() => setDropSprint(true)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {files.map((f) => (
            <span key={f} className={chip}>
              {f}
              <button aria-label={`Убрать ${f}`} onClick={() => setFiles((x) => x.filter((n) => n !== f))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {(dropTask || dropSprint) && (
            <button
              className="link text-[11px]"
              onClick={() => {
                setDropTask(false);
                setDropSprint(false);
              }}
            >
              Вернуть
            </button>
          )}
          <button onClick={() => fileRef.current?.click()} className="btn btn-secondary px-2 py-1 text-[11px]">
            <Paperclip className="h-3 w-3" />
            Прикрепить
          </button>
          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFiles((x) => [...x, f.name]);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Спросите о задаче или спринте. Я вижу контекст выше и могу разбить задачу на подзадачи,
            оценить объём или рассказать, что осталось до закрытия.
          </p>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id}>
              <p className="mb-1 text-[11px] text-muted-foreground">Сегодня · {m.time}</p>
              <div className="rounded-xl bg-muted px-3 py-2.5 text-[13px]">
                <span className="mb-0.5 block text-[11px] text-muted-foreground">Вы</span>
                {m.text}
              </div>
            </div>
          ) : m.error ? (
            <StatePanel
              key={m.id}
              variant="error"
              title={m.text}
              text="Проверьте соединение и повторите запрос."
              action="Повторить"
              onAction={() => ask(m.retryText ?? "", true)}
            />
          ) : (
            <div key={m.id} className="space-y-2.5">
              <p className="eyebrow">ИИ Ржомба</p>
              <p className="text-[13px] leading-relaxed whitespace-pre-line">{m.text}</p>

              {m.proposal && (
                <div className="rounded-xl border border-border p-3">
                  <p className="eyebrow mb-2 text-muted-foreground">
                    Предпросмотр · {m.proposal.applied ? "применено" : "ещё не применено"}
                  </p>
                  <ul className="divide-y divide-border">
                    {m.proposal.items.map((it) => (
                      <li key={it.title} className="py-2">
                        <p className="flex items-center gap-2 text-[13px] font-medium">
                          <span className="h-3 w-3 rounded-sm border border-input" />
                          {it.title}
                        </p>
                        {it.hint && <p className="mt-0.5 pl-5 text-[11px] text-muted-foreground">{it.hint}</p>}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                      Родитель: {m.proposal.taskKey}
                    </span>
                    <button
                      onClick={() => apply(m.id)}
                      disabled={m.proposal.applied}
                      className="btn btn-primary px-4"
                    >
                      {m.proposal.applied ? "Применено" : "Применить"}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Добавит подзадачи в {m.proposal.taskKey}. Исходный чек-лист сохранится.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <button className="hover:text-foreground" onClick={() => copy(m.text)}>
                  Копировать
                </button>
                {(["up", "down"] as const).map((f) => (
                  <button
                    key={f}
                    className={cn("hover:text-foreground", m.feedback === f && "font-semibold text-primary")}
                    onClick={() => {
                      setMessages((all) => all.map((x) => (x.id === m.id ? { ...x, feedback: f } : x)));
                      toast(f === "up" ? "Спасибо за оценку" : "Спасибо, мы учтём это");
                    }}
                  >
                    {f === "up" ? "Полезно" : "Не полезно"}
                  </button>
                ))}
              </div>
            </div>
          ),
        )}
        {typing && (
          <div className="space-y-2" aria-busy="true">
            <div className="skeleton h-3 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        )}
        <div ref={bottom} />
      </div>

      <div className="space-y-2.5 border-t border-border p-3">
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button key={q} onClick={() => ask(q)} className="btn btn-secondary px-2.5 py-1 text-[11px]">
              {q}
            </button>
          ))}
        </div>
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            rows={2}
            placeholder="Спросите о задаче или спринте…"
            className="field resize-none pr-11"
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim() || typing}
            aria-label="Отправить"
            className="btn btn-primary absolute right-2 bottom-2 h-7 w-7 p-0"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">Enter — отправить · Shift + Enter — новая строка</p>
        <p className="text-[10px] text-muted-foreground">Проверяйте важные выводы ИИ.</p>
      </div>
    </aside>
  );
}
