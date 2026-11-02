import { createFileRoute } from "@tanstack/react-router";
import { Plus, Tag, User, Repeat, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Avatar,
  DueTag,
  FilterSelect,
  Points,
  PriorityTag,
  ProgressBar,
  Segmented,
  StatePanel,
} from "@/components/rz";
import { Tour } from "@/components/Tour";
import {
  applyFilters,
  EMPTY_FILTERS,
  filtersActive,
  fmtRange,
  PRIORITY_LABELS,
  useStore,
  type Priority,
  type Task,
} from "@/lib/store";
import { cn, plural } from "@/lib/utils";

export const Route = createFileRoute("/_shell/board")({
  head: () => ({
    meta: [
      { title: "Доска — Ржомба" },
      { name: "description", content: "Доска проекта: перетаскивайте задачи между колонками." },
      { property: "og:title", content: "Доска — Ржомба" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Board,
});

function Card({
  task,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const { members, openTask, selectedId } = useStore();
  const assignee = members.find((m) => m.id === task.assigneeId);
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/task-id", task.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={() => openTask(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") openTask(task.id);
      }}
      className={cn(
        "cursor-grab rounded-xl border bg-card p-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition hover:bg-muted/60 active:cursor-grabbing",
        selectedId === task.id ? "border-primary/60" : "border-border",
        dragging && "opacity-40",
      )}
    >
      <div className="mb-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>{task.key}</span>
        <PriorityTag priority={task.priority} />
      </div>
      <p className="text-[13px] leading-snug font-semibold">{task.title}</p>
      {task.labels.length > 0 && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{task.labels.join(" · ")}</p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <Points value={task.points} />
        <DueTag due={task.due} />
        <span className="ml-auto">
          <Avatar member={assignee} size={22} />
        </span>
      </div>
    </div>
  );
}

function QuickAdd({ status }: { status: string }) {
  const { addTask, activeSprint, mode } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
        Добавить задачу
      </button>
    );
  }
  const submit = () => {
    if (title.trim()) {
      addTask({
        title,
        status,
        sprintId: mode === "scrum" && activeSprint ? activeSprint.id : null,
      });
    }
    setTitle("");
    setOpen(false);
  };
  return (
    <input
      autoFocus
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") {
          setTitle("");
          setOpen(false);
        }
      }}
      placeholder="Название задачи, Enter — создать"
      className="field"
    />
  );
}

function Board() {
  const {
    tasks,
    columns,
    members,
    sprints,
    mode,
    setMode,
    filters,
    setFilters,
    moveTask,
    setCreateOpen,
    project,
    seedSamples,
    setHelpOpen,
    addSprint,
    completeSprint,
    wipWarning,
  } = useStore();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const labels = useMemo(
    () => Array.from(new Set(tasks.flatMap((t) => t.labels))).sort(),
    [tasks],
  );
  const visible = applyFilters(tasks, filters);
  const doneIds = new Set(columns.filter((c) => c.type === "done").map((c) => c.id));

  const sprint = sprints.find((s) => s.id === filters.sprint) ?? null;
  const sprintTasks = sprint ? tasks.filter((t) => t.sprintId === sprint.id) : [];
  const sprintPts = sprintTasks.reduce((a, t) => a + t.points, 0);
  const sprintDonePts = sprintTasks.filter((t) => doneIds.has(t.status)).reduce((a, t) => a + t.points, 0);
  const pct = sprintPts ? Math.round((sprintDonePts / sprintPts) * 100) : 0;

  const totalPts = visible.reduce((a, t) => a + t.points, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-semibold tracking-tight">Доска</h1>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {project.members} {plural(project.members, ["участник", "участника", "участников"])}
          </span>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Ссылка на доску скопирована");
              } catch {
                toast.error("Не удалось скопировать ссылку");
              }
            }}
          >
            Поделиться
          </button>
          <button className="btn btn-primary" onClick={() => setCreateOpen({})}>
            <Plus className="h-3.5 w-3.5" />
            Создать задачу
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Исполнитель"
          icon={User}
          options={members.map((m) => ({
            value: m.id,
            label: m.name,
            leading: <Avatar member={m} size={18} />,
          }))}
          value={filters.assignees}
          onChange={(v) => setFilters({ ...filters, assignees: v })}
        />
        <FilterSelect
          label="Приоритет"
          icon={SlidersHorizontal}
          options={(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => ({
            value: p,
            label: PRIORITY_LABELS[p],
          }))}
          value={filters.priorities}
          onChange={(v) => setFilters({ ...filters, priorities: v as Priority[] })}
        />
        <FilterSelect
          label="Метки"
          icon={Tag}
          options={labels.map((l) => ({ value: l, label: l }))}
          value={filters.labels}
          onChange={(v) => setFilters({ ...filters, labels: v })}
        />
        <FilterSelect
          label="Спринт"
          icon={Repeat}
          single
          options={[
            { value: "", label: "Все задачи" },
            ...sprints.map((s) => ({ value: s.id, label: s.name })),
          ]}
          value={[filters.sprint ?? ""]}
          onChange={(v) => setFilters({ ...filters, sprint: v[0] ? v[0] : null })}
        />
        {filtersActive({ ...filters, sprint: mode === "scrum" ? null : filters.sprint }) && (
          <button
            className="link text-xs"
            onClick={() => setFilters({ ...EMPTY_FILTERS, sprint: mode === "scrum" ? filters.sprint : null })}
          >
            Сбросить
          </button>
        )}
        <div className="ml-auto">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "kanban", label: "Kanban" },
              { value: "scrum", label: "Scrum" },
            ]}
          />
        </div>
      </div>

      {mode === "scrum" && sprint && (
        <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-surface px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[13px]">
              <span className="font-semibold">{sprint.name}</span>
              <span
                className={cn(
                  "text-xs",
                  sprint.state === "active" ? "text-[var(--success)]" : "text-muted-foreground",
                )}
              >
                {sprint.state === "active" ? "Активен" : sprint.state === "planned" ? "Запланирован" : "Завершён"}
              </span>
              <span className="text-xs text-muted-foreground">{fmtRange(sprint.start, sprint.end)}</span>
            </p>
            {sprint.goal && <p className="mt-1 text-xs text-muted-foreground">Цель: {sprint.goal}</p>}
          </div>
          <div className="w-56">
            <p className="mb-1.5 text-right text-[11px] text-muted-foreground">
              {sprintDonePts} из {sprintPts} SP завершено · {pct}%
            </p>
            <ProgressBar value={pct} color="var(--success)" />
          </div>
          {sprint.state === "active" && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (window.confirm(`Завершить ${sprint.name}? Незакрытые задачи перейдут в следующий спринт.`)) {
                  completeSprint(sprint.id);
                }
              }}
            >
              Завершить спринт
            </button>
          )}
        </div>
      )}
      {mode === "scrum" && !sprint && (
        <StatePanel
          variant="empty"
          title="Спринт ещё не запланирован"
          text="Выберите задачи из бэклога и задайте цель спринта."
          action="Создать спринт"
          onAction={addSprint}
        />
      )}

      {tasks.length === 0 ? (
        <StatePanel
          variant="empty"
          title="Ваша первая доска готова"
          text="Создайте задачу или добавьте примеры для знакомства."
          action="Добавить примеры"
          onAction={seedSamples}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((col) => {
            const list = visible.filter((t) => t.status === col.id);
            const total = tasks.filter((t) => t.status === col.id).length;
            const overWip = col.wip != null && total > col.wip;
            const isOver = over === col.id;
            return (
              <section
                key={col.id}
                aria-label={col.name}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(col.id);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/task-id") || dragId;
                  if (id) moveTask(id, col.id);
                  setOver(null);
                  setDragId(null);
                }}
                className={cn(
                  "flex min-h-72 flex-col rounded-xl bg-surface p-3",
                  overWip && wipWarning && "ring-1 ring-destructive/50",
                )}
              >
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                  <h2 className="text-[13px] font-semibold">{col.name}</h2>
                  <span
                    className={cn(
                      "text-xs",
                      overWip && wipWarning ? "font-semibold text-destructive" : "text-muted-foreground",
                    )}
                    title={col.wip != null ? `Лимит WIP: ${col.wip}` : undefined}
                  >
                    {list.length}
                    {overWip && col.wip != null && ` / ${col.wip}`}
                  </span>
                  <button
                    aria-label={`Добавить задачу в «${col.name}»`}
                    onClick={() => setCreateOpen({ status: col.id })}
                    className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {list.map((t) => (
                    <Card
                      key={t.id}
                      task={t}
                      dragging={dragId === t.id}
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOver(null);
                      }}
                    />
                  ))}
                  {isOver && dragId && (
                    <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-primary/60 bg-accent/60 text-xs text-primary">
                      Переместить в «{col.name}»
                    </div>
                  )}
                  {list.length === 0 && !isOver && (
                    <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      {filtersActive(filters) && total > 0 ? (
                        <>
                          Нет задач по фильтрам.{" "}
                          <button
                            className="link"
                            onClick={() => setFilters({ ...EMPTY_FILTERS, sprint: mode === "scrum" ? filters.sprint : null })}
                          >
                            Сбросить
                          </button>
                        </>
                      ) : (
                        "Здесь начинается движение"
                      )}
                    </p>
                  )}
                  <QuickAdd status={col.id} />
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          {visible.length} {plural(visible.length, ["задача", "задачи", "задач"])} · {totalPts} SP · Обновлено только что
        </span>
        <span>
          N — новая задача · / — поиск ·{" "}
          <button className="hover:text-foreground" onClick={() => setHelpOpen(true)}>
            ? — сочетания клавиш
          </button>
        </span>
      </div>

      <Tour />
    </div>
  );
}
