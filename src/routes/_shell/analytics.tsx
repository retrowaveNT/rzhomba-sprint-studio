import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Download, Repeat, User } from "lucide-react";
import { useState } from "react";

import { Burndown } from "@/components/Burndown";
import { Avatar, FilterSelect, ProgressBar } from "@/components/rz";
import { fmtRangeYear, SNAPSHOT, SNAPSHOT_LABEL, useStore, type Task } from "@/lib/store";
import { plural } from "@/lib/utils";

export const Route = createFileRoute("/_shell/analytics")({
  head: () => ({
    meta: [
      { title: "Аналитика — Ржомба" },
      { name: "description", content: "Единый срез по задачам и story points." },
      { property: "og:title", content: "Аналитика — Ржомба" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const { tasks, sprints, columns, members, project } = useStore();
  const defaultSprint = sprints.find((s) => s.state === "active")?.id ?? sprints[0]?.id ?? "";
  const [sprintId, setSprintId] = useState(defaultSprint);
  const [people, setPeople] = useState<string[]>([]);

  const sprint = sprints.find((s) => s.id === sprintId) ?? null;
  const all = tasks.filter((t) => t.sprintId === sprintId);
  const list = people.length ? all.filter((t) => people.includes(t.assigneeId)) : all;
  const doneIds = new Set(columns.filter((c) => c.type === "done").map((c) => c.id));
  const pts = (l: Task[]) => l.reduce((a, t) => a + t.points, 0);

  const done = list.filter((t) => doneIds.has(t.status));
  const open = list.filter((t) => !doneIds.has(t.status));
  const inProgress = list.filter((t) => columns.find((c) => c.id === t.status)?.type === "in_progress");
  const overdue = open.filter((t) => t.due && t.due < SNAPSHOT).length;
  const today = open.filter((t) => t.due === SNAPSHOT).length;
  const pct = pts(list) ? Math.round((pts(done) / pts(list)) * 100) : 0;

  const byCol = columns.map((c) => ({ c, l: list.filter((t) => t.status === c.id) }));
  const C = 2 * Math.PI * 40;
  let acc = 0;

  const loads = members
    .map((m) => {
      const l = all.filter((t) => t.assigneeId === m.id);
      return { m, total: pts(l), done: pts(l.filter((t) => doneIds.has(t.status))) };
    })
    .filter((x) => x.total > 0);
  const maxLoad = Math.max(...loads.map((l) => l.total), 1);
  const idle = members.filter((m) => !all.some((t) => t.assigneeId === m.id));

  const exportCsv = () => {
    const rows = [
      ["Ключ", "Название", "Статус", "Исполнитель", "SP", "Срок"],
      ...list.map((t) => [
        t.key,
        t.title,
        columns.find((c) => c.id === t.status)?.name ?? t.status,
        members.find((m) => m.id === t.assigneeId)?.name ?? "",
        String(t.points),
        t.due ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.key}-${sprint?.name ?? "report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const card = "rounded-xl border border-border bg-card p-4";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Аналитика</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {project.name} · единый срез по задачам и story points
          </p>
        </div>
        <button className="btn btn-secondary" onClick={exportCsv} disabled={list.length === 0}>
          <Download className="h-3.5 w-3.5" />
          Экспорт отчёта
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Спринт"
          icon={Repeat}
          single
          options={sprints.map((s) => ({ value: s.id, label: s.name }))}
          value={[sprintId]}
          onChange={(v) => setSprintId(v[0] ?? defaultSprint)}
        />
        {sprint && (
          <span className="btn btn-secondary cursor-default">
            <Calendar className="h-3.5 w-3.5" />
            {fmtRangeYear(sprint.start, sprint.end)}
          </span>
        )}
        <FilterSelect
          label="Все участники"
          icon={User}
          options={members.map((m) => ({ value: m.id, label: m.name, leading: <Avatar member={m} size={18} /> }))}
          value={people}
          onChange={setPeople}
        />
        <span className="ml-auto text-xs text-muted-foreground">Срез: {SNAPSHOT_LABEL}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className={card}>
          <p className="text-xs text-muted-foreground">Выполнено по SP</p>
          <p className="mt-1 text-[26px] font-semibold text-primary">{pct}%</p>
          <p className="text-[11px] text-muted-foreground">
            {pts(done)} из {pts(list)} SP
          </p>
        </div>
        <div className={card}>
          <p className="text-xs text-muted-foreground">Задач готово</p>
          <p className="mt-1 text-[26px] font-semibold text-[var(--success)]">
            {done.length} / {list.length}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {open.length} {plural(open.length, ["задача", "задачи", "задач"])} ещё открыто
          </p>
        </div>
        <div className={card}>
          <p className="text-xs text-muted-foreground">В работе</p>
          <p className="mt-1 text-[26px] font-semibold text-[var(--warning)]">{pts(inProgress)} SP</p>
          <p className="text-[11px] text-muted-foreground">
            {inProgress.length} {plural(inProgress.length, ["задача", "задачи", "задач"])} в процессе
          </p>
        </div>
        <div className={card}>
          <p className="text-xs text-muted-foreground">Просрочено</p>
          <p className={`mt-1 text-[26px] font-semibold ${overdue > 0 ? "text-destructive" : ""}`}>{overdue}</p>
          <p className="text-[11px] text-muted-foreground">
            {today} {plural(today, ["задача", "задачи", "задач"])} со сроком сегодня
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className={card}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Прогресс спринта · Burndown</h3>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {pts(open)} SP осталось
            </span>
          </div>
          {sprint ? (
            <Burndown
              start={sprint.start}
              end={sprint.end}
              total={pts(list) || 1}
              remaining={sprint.state === "active" ? pts(open) : undefined}
              height={190}
            />
          ) : null}
          <p className="mt-1 text-[11px] text-muted-foreground">
            Схема динамики · промежуточные точки иллюстративные. Итог среза: {pts(done)} / {pts(list)} SP.
          </p>
        </div>

        <div className={card}>
          <h3 className="mb-3 text-[13px] font-semibold">Распределение задач</h3>
          <div className="relative mx-auto h-36 w-36">
            <svg viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--muted)" strokeWidth="14" />
              {list.length > 0 &&
                byCol.map(({ c, l }) => {
                  const len = (l.length / list.length) * C;
                  const el = (
                    <circle
                      key={c.id}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={c.color}
                      strokeWidth="14"
                      strokeDasharray={`${len} ${C - len}`}
                      strokeDashoffset={-acc}
                    />
                  );
                  acc += len;
                  return el;
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold">{list.length}</span>
              <span className="text-[11px] text-muted-foreground">задач</span>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {byCol.map(({ c, l }) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                <span className="flex-1">{c.name}</span>
                <span className="text-muted-foreground">
                  {l.length} · {pts(l)} SP
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold">Нагрузка команды</h3>
          <span className="text-[11px] text-muted-foreground">Всего SP · завершено включено</span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
          <ul className="space-y-3">
            {loads.map((l) => (
              <li key={l.m.id} className="flex items-center gap-3 text-[13px]">
                <Avatar member={l.m} size={24} />
                <span className="w-36 shrink-0">{l.m.name}</span>
                <ProgressBar value={(l.total / maxLoad) * 100} className="h-2 flex-1" />
                <span className="w-32 shrink-0 text-right text-xs text-muted-foreground">
                  {l.total} SP · готово {l.done}
                </span>
              </li>
            ))}
            {loads.length === 0 && <li className="text-xs text-muted-foreground">В этом спринте нет задач.</li>}
          </ul>
          <div className="text-xs">
            <p className="text-muted-foreground">Без задач в этом спринте</p>
            <p className="mt-1 text-[13px] font-semibold">{idle.map((m) => m.name).join(" · ") || "—"}</p>
            <p className="mt-1 text-muted-foreground">
              {idle.length} из {members.length} участников
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
