import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Component,
  Diamond,
  FileText,
  Layers,
  Link2,
  MoreHorizontal,
  Repeat,
  Send,
  Sparkles,
  Tag,
  User,
  X,
  Flag,
  PanelLeft,
} from "lucide-react";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Avatar, ProgressBar, StatePanel } from "@/components/rz";
import { fmtLong, PRIORITY_LABELS, useStore, dueState, type Priority } from "@/lib/store";
import { cn } from "@/lib/utils";

const POINTS = [1, 2, 3, 5, 8, 13];

function RichLine({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">
            {p}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

function Meta({ icon: Icon, label, children }: { icon: typeof User; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="w-[4.5rem] shrink-0 text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1 font-medium">{children}</div>
    </div>
  );
}

const inlineSelect =
  "-ml-1 max-w-full cursor-pointer rounded bg-transparent px-1 py-0.5 font-medium hover:bg-muted focus:bg-muted";

export function TaskDrawer() {
  const {
    selectedId,
    selectedTask: task,
    closeTask,
    moveTask,
    updateTask,
    toggleCheck,
    addComment,
    columns,
    members,
    epics,
    sprints,
    setAiOpen,
    aiOpen,
    project,
  } = useStore();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setEditing(false);
    setComment("");
    setMenu(false);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTask();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, closeTask]);

  if (!selectedId) return null;

  const shell = (children: ReactNode) => (
    <div
      className="fixed top-0 bottom-0 left-0 z-40 flex justify-end bg-black/25"
      style={{ right: aiOpen ? 320 : 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeTask();
      }}
    >
      <aside
        role="dialog"
        aria-label="Карточка задачи"
        className="flex h-full w-[540px] max-w-full flex-col overflow-y-auto border-l border-border bg-card shadow-2xl"
      >
        {children}
      </aside>
    </div>
  );

  if (!task) {
    return shell(
      <div className="p-6">
        <StatePanel
          variant="error"
          title="Задача недоступна"
          text="Она удалена или у вас нет доступа. Обратитесь к владельцу."
          action="Вернуться на доску"
          onAction={() => {
            closeTask();
            navigate({ to: "/board" });
          }}
        />
      </div>,
    );
  }

  const assignee = members.find((m) => m.id === task.assigneeId);
  const done = task.checklist.filter((c) => c.done).length;
  const pct = task.checklist.length ? (done / task.checklist.length) * 100 : 0;
  const colName = columns.find((c) => c.id === task.status)?.name ?? task.status;
  const due = task.due ? dueState(task.due) : null;

  const send = () => {
    if (!comment.trim()) return;
    addComment(task.id, comment.trim());
    setComment("");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/board#${task.key}`);
      toast.success("Ссылка на задачу скопирована");
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  return shell(
    <>
      <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-xs text-muted-foreground">
        <PanelLeft className="h-3.5 w-3.5" />
        <span>
          {project.name} / {task.key}
        </span>
        <div className="relative ml-auto flex items-center gap-1">
          <button onClick={copyLink} aria-label="Скопировать ссылку" className="rounded p-1.5 hover:bg-muted">
            <Link2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setMenu((v) => !v)}
            aria-label="Ещё"
            aria-expanded={menu}
            className="rounded p-1.5 hover:bg-muted"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menu && (
            <div className="absolute top-full right-0 z-10 mt-1 w-48 rounded-xl border border-border bg-popover p-1.5 text-foreground shadow-xl">
              <button
                className="w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
                onClick={() => {
                  setMenu(false);
                  copyLink();
                }}
              >
                Копировать ссылку
              </button>
              <button
                className="w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
                onClick={() => {
                  setMenu(false);
                  closeTask();
                }}
              >
                Закрыть
              </button>
            </div>
          )}
          <button onClick={closeTask} aria-label="Закрыть" className="rounded p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-5 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <label className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklch,var(--warning)_16%,transparent)] px-2.5 py-1 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: columns.find((c) => c.id === task.status)?.color }} />
            <select
              aria-label="Статус"
              value={task.status}
              onChange={(e) => moveTask(task.id, e.target.value)}
              className="cursor-pointer bg-transparent outline-none"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => setAiOpen(true)} className="btn btn-secondary">
            <Sparkles className="h-3.5 w-3.5" />
            Спросить ИИ
          </button>
        </div>

        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">{task.title}</h2>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          <Meta icon={User} label="Исполнитель">
            <span className="flex items-center gap-1.5">
              <Avatar member={assignee} size={16} />
              <select
                aria-label="Исполнитель"
                value={task.assigneeId}
                onChange={(e) => updateTask(task.id, { assigneeId: e.target.value })}
                className={inlineSelect}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </span>
          </Meta>
          <Meta icon={Flag} label="Приоритет">
            <select
              aria-label="Приоритет"
              value={task.priority}
              onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}
              className={inlineSelect}
            >
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </Meta>
          <Meta icon={Diamond} label="Оценка">
            <select
              aria-label="Оценка"
              value={task.points}
              onChange={(e) => updateTask(task.id, { points: Number(e.target.value) })}
              className={inlineSelect}
            >
              {POINTS.map((p) => (
                <option key={p} value={p}>
                  {p} SP
                </option>
              ))}
            </select>
          </Meta>
          <Meta icon={Repeat} label="Спринт">
            <select
              aria-label="Спринт"
              value={task.sprintId ?? ""}
              onChange={(e) => updateTask(task.id, { sprintId: e.target.value || null })}
              className={inlineSelect}
            >
              <option value="">Без спринта</option>
              {sprints
                .filter((s) => s.state !== "completed" || s.id === task.sprintId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </Meta>
          <Meta icon={Layers} label="Эпик">
            <select
              aria-label="Эпик"
              value={task.epicId ?? ""}
              onChange={(e) => updateTask(task.id, { epicId: e.target.value || null })}
              className={inlineSelect}
            >
              <option value="">Без эпика</option>
              {epics.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Meta>
          <Meta icon={Calendar} label="Срок">
            <span className="flex items-center gap-1.5">
              <input
                type="date"
                aria-label="Срок"
                value={task.due ?? ""}
                onChange={(e) => updateTask(task.id, { due: e.target.value || null })}
                className={cn(
                  inlineSelect,
                  due === "overdue" && "text-destructive",
                  due === "soon" && "text-[var(--warning)]",
                )}
              />
            </span>
          </Meta>
          <div className="col-span-2">
            <Meta icon={Tag} label="Метки">
              <span className="flex flex-wrap gap-1.5">
                {task.labels.length === 0 && <span className="text-muted-foreground">Без меток</span>}
                {task.labels.map((l) => (
                  <span key={l} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                    {l}
                  </span>
                ))}
              </span>
            </Meta>
          </div>
        </div>
        {task.due && (
          <p className="-mt-3 text-[11px] text-muted-foreground">Срок: {fmtLong(task.due)} · статус «{colName}»</p>
        )}

        <section className="border-t border-border pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Описание</h3>
            <span className="text-[11px] text-muted-foreground">
              Markdown ·{" "}
              <button
                className="link"
                onClick={() => {
                  setDraft(task.description);
                  setEditing((v) => !v);
                }}
              >
                {editing ? "Отмена" : "Редактировать"}
              </button>
            </span>
          </div>
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                className="field resize-y"
                placeholder="Что нужно сделать и как понять, что готово? **Жирный** — через звёздочки."
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                  Отмена
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    updateTask(task.id, { description: draft });
                    setEditing(false);
                  }}
                >
                  Сохранить
                </button>
              </div>
            </div>
          ) : task.description.trim() === "" ? (
            <StatePanel
              variant="empty"
              title="Добавьте контекст задачи"
              text="Нет описания, комментариев и вложений."
              action="Добавить описание"
              onAction={() => {
                setDraft("");
                setEditing(true);
              }}
            />
          ) : (
            <div className="space-y-1 text-[13px] leading-relaxed text-muted-foreground">
              {task.description.split("\n").map((line, i) => (
                <p key={i}>
                  <RichLine text={line} />
                </p>
              ))}
            </div>
          )}
        </section>

        {task.checklist.length > 0 && (
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold">Критерии готовности</h3>
              <span className="text-[11px] text-muted-foreground">
                {done} из {task.checklist.length}
              </span>
            </div>
            <ProgressBar value={pct} className="mb-3" />
            <ul className="space-y-2">
              {task.checklist.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                    <input
                      type="checkbox"
                      checked={c.done}
                      onChange={() => toggleCheck(task.id, c.id)}
                      className="h-3.5 w-3.5 accent-[var(--primary)]"
                    />
                    <span className={cn(c.done && "text-muted-foreground line-through")}>{c.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        {task.subtasks.length > 0 && (
          <section>
            <h3 className="mb-2 text-[13px] font-semibold">Подзадачи · {task.subtasks.length}</h3>
            <ul className="space-y-2">
              {task.subtasks.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                    <input
                      type="checkbox"
                      checked={c.done}
                      onChange={() => toggleCheck(task.id, c.id, "subtasks")}
                      className="h-3.5 w-3.5 accent-[var(--primary)]"
                    />
                    <span className={cn(c.done && "text-muted-foreground line-through")}>{c.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        {task.attachments.length > 0 && (
          <section>
            <h3 className="mb-2 text-[13px] font-semibold">Вложения · {task.attachments.length}</h3>
            <div className="grid grid-cols-2 gap-3">
              {task.attachments.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toast(`Открытие «${a.name}» недоступно в прототипе`)}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted"
                >
                  {a.kind === "figma" ? (
                    <Component className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{a.name}</span>
                    <span className="block text-[11px] text-muted-foreground">{a.meta}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-border pt-4">
          <h3 className="mb-3 text-[13px] font-semibold">Комментарии · {task.comments.length}</h3>
          <ul className="space-y-3">
            {task.comments.map((c) => {
              const a = members.find((m) => m.id === c.authorId);
              return (
                <li key={c.id} className="flex gap-3">
                  <Avatar member={a} size={24} />
                  <div className="min-w-0 text-[13px]">
                    <p>
                      <span className="font-semibold">{a?.name}</span>{" "}
                      <span className="text-[11px] text-muted-foreground">{c.time}</span>
                    </p>
                    <p className="text-muted-foreground">{c.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="relative mt-3">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Написать комментарий… @ — упомянуть"
              className="field pr-10"
            />
            <button
              onClick={send}
              disabled={!comment.trim()}
              aria-label="Отправить комментарий"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-primary disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </section>

        {task.history.length > 0 && (
          <section>
            <h3 className="mb-2 text-[13px] font-semibold">История изменений</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {task.history.map((h) => (
                <li key={h.id}>{h.text}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>,
  );
}
