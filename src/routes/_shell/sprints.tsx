import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Burndown } from "@/components/Burndown";
import { Modal, ProgressBar, StatePanel } from "@/components/rz";
import { fmtRangeYear, useStore, type Sprint } from "@/lib/store";
import { cn, plural } from "@/lib/utils";

export const Route = createFileRoute("/_shell/sprints")({
  head: () => ({
    meta: [
      { title: "Спринты — Ржомба" },
      { name: "description", content: "Планируйте итерации и держите фокус на цели команды." },
      { property: "og:title", content: "Спринты — Ржомба" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Sprints,
});

const STATE_LABEL = { active: "Активен", planned: "Запланирован", completed: "Завершён" } as const;

function Sprints() {
  const { sprints, tasks, columns, addSprint, updateSprint, completeSprint } = useStore();
  const [tab, setTab] = useState<"all" | "active" | "done">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [edit, setEdit] = useState<Sprint | null>(null);

  const doneIds = new Set(columns.filter((c) => c.type === "done").map((c) => c.id));
  const stats = (id: string) => {
    const list = tasks.filter((t) => t.sprintId === id);
    const done = list.filter((t) => doneIds.has(t.status));
    const pts = list.reduce((a, t) => a + t.points, 0);
    const donePts = done.reduce((a, t) => a + t.points, 0);
    return { count: list.length, done: done.length, pts, donePts, pct: pts ? Math.round((donePts / pts) * 100) : 0 };
  };

  const order = { active: 0, planned: 1, completed: 2 } as const;
  const sorted = [...sprints].sort((a, b) => order[a.state] - order[b.state]);
  const list = sorted.filter((s) => (tab === "all" ? true : tab === "active" ? s.state === "active" : s.state === "completed"));
  const current = sprints.find((s) => s.id === selected) ?? list[0] ?? null;
  const activeCount = sprints.filter((s) => s.state === "active").length;
  const st = current ? stats(current.id) : null;

  const tabBtn = (v: typeof tab, label: string) => (
    <button key={v} className="btn btn-secondary" aria-pressed={tab === v} onClick={() => setTab(v)}>
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Спринты</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Планируйте итерации и держите фокус на цели команды.
          </p>
        </div>
        <button className="btn btn-primary" onClick={addSprint}>
          <Plus className="h-3.5 w-3.5" />
          Создать спринт
        </button>
      </div>

      <div className="flex items-center gap-2">
        {tabBtn("all", "Все спринты")}
        {tabBtn("active", `Активные · ${activeCount}`)}
        {tabBtn("done", "Завершённые")}
        <span className="ml-auto text-xs text-muted-foreground">
          {sprints.length} {plural(sprints.length, ["спринт", "спринта", "спринтов"])} · Платформа 2.0
        </span>
      </div>

      {list.length === 0 || !current || !st ? (
        <StatePanel
          variant="empty"
          title="Спринт ещё не запланирован"
          text="Выберите задачи из бэклога и задайте цель спринта."
          action="Создать спринт"
          onAction={addSprint}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="space-y-3">
            {list.map((s) => {
              const x = stats(s.id);
              const sel = s.id === current.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  aria-pressed={sel}
                  className={cn(
                    "block w-full rounded-xl border p-4 text-left transition-colors",
                    sel ? "border-primary/50 bg-accent" : "border-border bg-card hover:bg-muted/60",
                  )}
                >
                  <p className="flex items-center gap-2 text-[13px]">
                    <span className="font-semibold">{s.name}</span>
                    <span
                      className={cn(
                        "text-xs",
                        s.state === "active" ? "text-[var(--success)]" : "text-muted-foreground",
                      )}
                    >
                      {STATE_LABEL[s.state]}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{fmtRangeYear(s.start, s.end)}</p>
                  {s.note ? (
                    <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {x.count} {plural(x.count, ["задача", "задачи", "задач"])} · {x.pts} SP
                    </p>
                  )}
                  {s.state === "active" && (
                    <>
                      <div className="mt-2 flex justify-between text-[11px]">
                        <span>
                          {x.donePts} / {x.pts} SP
                        </span>
                        <span className="text-primary">{x.pct}%</span>
                      </div>
                      <ProgressBar value={x.pct} className="mt-1" />
                      <Link to="/sprint-planning" className="link mt-2 inline-block text-xs">
                        Открыть планирование →
                      </Link>
                    </>
                  )}
                </button>
              );
            })}
            <button
              onClick={addSprint}
              className="btn btn-secondary w-full border-dashed py-2.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Создать спринт
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold">{current.name}</h2>
                <button className="btn btn-secondary" onClick={() => setEdit(current)}>
                  Редактировать
                </button>
              </div>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className={current.state === "active" ? "text-[var(--success)]" : ""}>
                  {STATE_LABEL[current.state]}
                </span>
                {fmtRangeYear(current.start, current.end)}
              </p>
              <p className="eyebrow mt-4 text-muted-foreground">Цель спринта</p>
              <p className="mt-1 text-[13px]">{current.goal || "Цель пока не задана."}</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-semibold">{st.pct}%</p>
                  <p className="text-[11px] text-muted-foreground">Выполнено по SP</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {st.done} / {st.count}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Задач готово</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{st.pts - st.donePts} SP</p>
                  <p className="text-[11px] text-muted-foreground">Осталось</p>
                </div>
              </div>
              <ProgressBar value={st.pct} className="mt-4" />
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold">Burndown · {current.name}</h3>
                {current.state === "active" && (
                  <span className="text-[11px] text-muted-foreground">Срез на 16 октября</span>
                )}
              </div>
              <div className="mb-2 flex gap-4 text-[11px]">
                <span className="text-primary">Факт{current.state === "active" ? ` · ${st.pts - st.donePts} SP осталось` : ""}</span>
                <span className="text-muted-foreground">План</span>
              </div>
              <Burndown
                start={current.start}
                end={current.end}
                total={st.pts || 1}
                remaining={current.state === "active" ? st.pts - st.donePts : undefined}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Схема динамики · промежуточные точки иллюстративные.
                {current.state === "active" && ` Итог среза: ${st.donePts} / ${st.pts} SP.`}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Link to="/sprint-planning" className="btn btn-primary">
                Перейти к планированию
              </Link>
              {current.state === "active" && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (window.confirm(`Завершить ${current.name}? Незакрытые задачи перейдут в следующий спринт.`))
                      completeSprint(current.id);
                  }}
                >
                  Завершить спринт
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={edit !== null} onClose={() => setEdit(null)} title="Редактировать спринт">
        {edit && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!edit.name.trim() || edit.end < edit.start) return;
              updateSprint(edit.id, { name: edit.name.trim(), goal: edit.goal, start: edit.start, end: edit.end });
              setEdit(null);
            }}
          >
            <label className="block text-[13px] font-medium">
              <span className="mb-1.5 block">Название</span>
              <input className="field" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </label>
            <label className="block text-[13px] font-medium">
              <span className="mb-1.5 block">Цель спринта</span>
              <textarea
                rows={3}
                className="field resize-none"
                value={edit.goal}
                onChange={(e) => setEdit({ ...edit, goal: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[13px] font-medium">
                <span className="mb-1.5 block">Начало</span>
                <input type="date" className="field" value={edit.start} onChange={(e) => setEdit({ ...edit, start: e.target.value })} />
              </label>
              <label className="block text-[13px] font-medium">
                <span className="mb-1.5 block">Конец</span>
                <input type="date" className="field" value={edit.end} onChange={(e) => setEdit({ ...edit, end: e.target.value })} />
              </label>
            </div>
            {edit.end < edit.start && <p className="text-xs text-destructive">Конец спринта раньше начала</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setEdit(null)}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary">
                Сохранить
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
