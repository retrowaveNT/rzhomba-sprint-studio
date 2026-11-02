import { createFileRoute, Link } from "@tanstack/react-router";
import { Diamond, GripVertical, Search } from "lucide-react";
import { useState } from "react";

import { Avatar, ProgressBar, StatePanel } from "@/components/rz";
import { fmtRangeYear, useStore, type Task } from "@/lib/store";
import { cn, plural } from "@/lib/utils";

export const Route = createFileRoute("/_shell/sprint-planning")({
  head: () => ({
    meta: [
      { title: "Планирование спринта — Ржомба" },
      { name: "description", content: "Перетащите задачи из бэклога в спринт." },
      { property: "og:title", content: "Планирование спринта — Ржомба" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Planning,
});

function Row({ t, onDragStart }: { t: Task; onDragStart: () => void }) {
  const { members, openTask } = useStore();
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/task-id", t.id);
        onDragStart();
      }}
      onClick={() => openTask(t.id)}
      className="flex cursor-grab items-center gap-3 border-b border-border px-3 py-3 text-[13px] hover:bg-muted/60"
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{t.key}</span>
      <span className="min-w-0 flex-1 truncate">{t.title}</span>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Diamond className="h-3 w-3" />
        {t.points}
      </span>
      <Avatar member={members.find((m) => m.id === t.assigneeId)} size={22} />
    </li>
  );
}

function Planning() {
  const { activeSprint, tasks, columns, assignSprint, epics, addSprint } = useStore();
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<"backlog" | "sprint" | null>(null);

  if (!activeSprint) {
    return (
      <StatePanel
        variant="empty"
        title="Спринт ещё не запланирован"
        text="Выберите задачи из бэклога и задайте цель спринта."
        action="Создать спринт"
        onAction={addSprint}
      />
    );
  }

  const doneIds = new Set(columns.filter((c) => c.type === "done").map((c) => c.id));
  const inSprint = tasks.filter((t) => t.sprintId === activeSprint.id);
  const backlog = tasks
    .filter((t) => t.sprintId === null)
    .filter((t) => `${t.key} ${t.title}`.toLowerCase().includes(q.trim().toLowerCase()));
  const pts = (l: Task[]) => l.reduce((a, t) => a + t.points, 0);
  const donePts = pts(inSprint.filter((t) => doneIds.has(t.status)));
  const pct = pts(inSprint) ? Math.round((donePts / pts(inSprint)) * 100) : 0;

  const drop = (target: "backlog" | "sprint") => {
    if (drag) assignSprint(drag, target === "sprint" ? activeSprint.id : null);
    setDrag(null);
    setOver(null);
  };

  const zone = (target: "backlog" | "sprint") => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(target);
    },
    onDragLeave: () => setOver(null),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      drop(target);
    },
  });

  const grouped = epics
    .map((e) => ({ e, list: backlog.filter((t) => t.epicId === e.id) }))
    .filter((g) => g.list.length > 0);
  const noEpic = backlog.filter((t) => !t.epicId);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            <Link to="/sprints" className="hover:text-foreground">
              Спринты
            </Link>{" "}
            / {activeSprint.name}
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Планирование спринта</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/sprints" className="btn btn-secondary">
            Редактировать
          </Link>
          <Link to="/board" className="btn btn-primary">
            Открыть доску
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3 text-[13px]">
          <span className="font-semibold">{activeSprint.name}</span>
          <span className="text-xs text-[var(--success)]">Активен</span>
          <span className="text-xs text-muted-foreground">{fmtRangeYear(activeSprint.start, activeSprint.end)}</span>
          <span className="ml-auto text-xs text-primary">
            {donePts} / {pts(inSprint)} SP · {pct}%
          </span>
        </div>
        {activeSprint.goal && <p className="mt-2 text-xs text-muted-foreground">Цель: {activeSprint.goal}</p>}
        <ProgressBar value={pct} className="mt-3" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-label="Backlog" className="rounded-xl border border-border bg-surface p-4" {...zone("backlog")}>
          <div className="mb-3 flex items-center justify-between text-[13px]">
            <h2 className="font-semibold">Backlog</h2>
            <span className="text-xs text-muted-foreground">
              {backlog.length} {plural(backlog.length, ["задача", "задачи", "задач"])} · {pts(backlog)} SP
            </span>
          </div>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти задачу…" className="field bg-card pl-9" />
          </div>
          <ul>
            {grouped.map((g) => (
              <li key={g.e.id}>
                <p className="px-1 py-1.5 text-[11px] text-muted-foreground">◈ {g.e.name} · вне активного спринта</p>
                <ul>
                  {g.list.map((t) => (
                    <Row key={t.id} t={t} onDragStart={() => setDrag(t.id)} />
                  ))}
                </ul>
              </li>
            ))}
            {noEpic.length > 0 && (
              <li>
                <p className="px-1 py-1.5 text-[11px] text-muted-foreground">Без эпика</p>
                <ul>
                  {noEpic.map((t) => (
                    <Row key={t.id} t={t} onDragStart={() => setDrag(t.id)} />
                  ))}
                </ul>
              </li>
            )}
          </ul>
          <div
            className={cn(
              "mt-3 flex h-28 items-center justify-center rounded-xl border border-dashed px-6 text-center text-xs",
              over === "backlog" && drag ? "border-primary bg-accent text-primary" : "border-input text-muted-foreground",
            )}
          >
            ← Перетащите сюда задачу, чтобы убрать её из спринта
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Перенос меняет спринт, но не статус задачи.</p>
        </section>

        <section aria-label={activeSprint.name} className="rounded-xl border border-border bg-surface p-4" {...zone("sprint")}>
          <div className="mb-3 flex items-center justify-between text-[13px]">
            <h2 className="font-semibold">{activeSprint.name}</h2>
            <span className="text-xs text-muted-foreground">
              {inSprint.length} {plural(inSprint.length, ["задача", "задачи", "задач"])} · {pts(inSprint)} SP
            </span>
          </div>
          <div
            className={cn(
              "mb-3 flex h-12 items-center justify-center rounded-xl border border-dashed text-xs",
              over === "sprint" && drag ? "border-primary bg-accent text-primary" : "border-primary/40 text-primary",
            )}
          >
            Перетащите задачу из Backlog →
          </div>
          <ul>
            {inSprint.map((t) => (
              <Row key={t.id} t={t} onDragStart={() => setDrag(t.id)} />
            ))}
          </ul>
        </section>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Состав сохранён · {inSprint.length} {plural(inSprint.length, ["задача", "задачи", "задач"])} · {pts(inSprint)} SP
      </p>
    </div>
  );
}
