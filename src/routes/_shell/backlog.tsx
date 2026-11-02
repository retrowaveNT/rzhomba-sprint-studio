import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, GripVertical, Layers, Plus, Repeat, Tag, User } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Avatar,
  DueTag,
  FilterSelect,
  Modal,
  Points,
  PriorityTag,
  StatePanel,
} from "@/components/rz";
import {
  applyFilters,
  EMPTY_FILTERS,
  fmtRange,
  PRIORITY_LABELS,
  useStore,
  type Priority,
  type Task,
} from "@/lib/store";
import { cn, plural } from "@/lib/utils";

export const Route = createFileRoute("/_shell/backlog")({
  head: () => ({
    meta: [
      { title: "Бэклог — Ржомба" },
      { name: "description", content: "Бэклог проекта: эпики, оценки и порядок задач." },
      { property: "og:title", content: "Бэклог — Ржомба" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Backlog,
});

function Backlog() {
  const {
    tasks,
    epics,
    members,
    columns,
    filters,
    setFilters,
    openTask,
    addTask,
    addEpic,
    reorderTask,
    setCreateOpen,
    activeSprint,
    project,
  } = useStore();
  const f = { ...filters, sprint: null };
  const [grouped, setGrouped] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ notif: true });
  const [quick, setQuick] = useState("");
  const [quickEpic, setQuickEpic] = useState<string | null>(null);
  const [epicDialog, setEpicDialog] = useState(false);
  const [epicName, setEpicName] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const labels = useMemo(() => Array.from(new Set(tasks.flatMap((t) => t.labels))).sort(), [tasks]);
  const visible = applyFilters(tasks, f);
  const doneIds = new Set(columns.filter((c) => c.type === "done").map((c) => c.id));
  const pts = (list: Task[]) => list.reduce((a, t) => a + t.points, 0);
  const dragging = tasks.find((t) => t.id === dragId);
  const overTask = tasks.find((t) => t.id === overId);

  const sprintTasks = activeSprint ? tasks.filter((t) => t.sprintId === activeSprint.id) : [];

  const groups = grouped
    ? [
        ...epics.map((e) => ({ id: e.id, name: e.name, list: visible.filter((t) => t.epicId === e.id) })),
        { id: "none", name: "Без эпика", list: visible.filter((t) => !t.epicId) },
      ].filter((g) => g.id !== "none" || g.list.length > 0)
    : [{ id: "all", name: "Все задачи", list: visible }];

  const statusColor = (t: Task) => columns.find((c) => c.id === t.status)?.color;

  const submitQuick = () => {
    if (!quick.trim()) return;
    addTask({ title: quick, epicId: (quickEpic ?? epics[0]?.id ?? "") || null });
    setQuick("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-semibold tracking-tight">Бэклог</h1>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length} {plural(tasks.length, ["задача", "задачи", "задач"])} · {pts(tasks)} SP
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn btn-secondary" onClick={() => setEpicDialog(true)}>
            <Layers className="h-3.5 w-3.5" />
            Новый эпик
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
          options={members.map((m) => ({ value: m.id, label: m.name, leading: <Avatar member={m} size={18} /> }))}
          value={filters.assignees}
          onChange={(v) => setFilters({ ...filters, assignees: v })}
        />
        <FilterSelect
          label="Приоритет"
          options={(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
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
        {(f.assignees.length + f.priorities.length + f.labels.length > 0) && (
          <button className="link text-xs" onClick={() => setFilters({ ...EMPTY_FILTERS, sprint: filters.sprint })}>
            Сбросить
          </button>
        )}
        <div className="ml-auto">
          <button
            className="btn btn-secondary"
            aria-pressed={grouped}
            onClick={() => setGrouped((g) => !g)}
          >
            Группировать: {grouped ? "эпик" : "нет"} <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
        <Plus className="h-4 w-4 text-primary" />
        <input
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitQuick()}
          placeholder="Название новой задачи…"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
        />
        <select
          aria-label="Эпик новой задачи"
          value={quickEpic ?? epics[0]?.id ?? ""}
          onChange={(e) => setQuickEpic(e.target.value)}
          className="rounded bg-transparent text-xs text-muted-foreground outline-none"
        >
          {epics.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
          <option value="">Без эпика</option>
        </select>
        <span className="text-[11px] text-muted-foreground">Enter ↵</span>
      </div>

      {activeSprint && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-[13px]">
          <Repeat className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold">{activeSprint.name}</span>
          <span className="text-xs text-[var(--success)]">Активен</span>
          <span className="text-xs text-muted-foreground">
            {fmtRange(activeSprint.start, activeSprint.end)} · {sprintTasks.length}{" "}
            {plural(sprintTasks.length, ["задача", "задачи", "задач"])} · {pts(sprintTasks)} SP
          </span>
          <Link to="/board" className="link ml-auto text-xs">
            Открыть доску →
          </Link>
        </div>
      )}

      {tasks.length === 0 ? (
        <StatePanel
          variant="empty"
          title="Бэклог пока пуст"
          text="Создайте задачи и объедините их в эпики."
          action="Создать задачу"
          onAction={() => setCreateOpen({})}
        />
      ) : visible.length === 0 ? (
        <StatePanel
          variant="empty"
          title="Ничего не найдено"
          text="Измените или сбросьте фильтры."
          action="Сбросить фильтры"
          onAction={() => setFilters({ ...EMPTY_FILTERS, sprint: filters.sprint })}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const open = !collapsed[g.id];
            const done = g.list.filter((t) => doneIds.has(t.status)).length;
            return (
              <section key={g.id} aria-label={g.name}>
                <div className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2.5 text-[13px]">
                  <button
                    aria-label={open ? "Свернуть" : "Развернуть"}
                    aria-expanded={open}
                    onClick={() => setCollapsed((c) => ({ ...c, [g.id]: open }))}
                    className="text-muted-foreground"
                  >
                    {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold">{g.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {g.list.length} {plural(g.list.length, ["задача", "задачи", "задач"])} · {pts(g.list)} SP
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {!open ? "Свёрнут" : done > 0 ? `${done} завершено` : "Не начат"}
                  </span>
                </div>
                {open && (
                  <ul
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId && grouped && g.list.length === 0) reorderTask(dragId, null, g.id === "none" ? null : g.id);
                      setDragId(null);
                      setOverId(null);
                    }}
                    className="min-h-2"
                  >
                    {g.list.map((t) => {
                      const assignee = members.find((m) => m.id === t.assigneeId);
                      return (
                        <li
                          key={t.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/task-id", t.id);
                            setDragId(t.id);
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverId(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOverId(t.id);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (dragId) reorderTask(dragId, t.id);
                            setDragId(null);
                            setOverId(null);
                          }}
                          className={cn(
                            "relative",
                            overId === t.id && dragId && dragId !== t.id && "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-primary",
                          )}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => openTask(t.id)}
                            onKeyDown={(e) => e.key === "Enter" && openTask(t.id)}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 text-[13px] hover:bg-muted/60",
                              dragId === t.id && "border border-primary/50 bg-accent opacity-70",
                            )}
                          >
                            <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/60" />
                            <span className="w-16 shrink-0 text-xs text-muted-foreground">{t.key}</span>
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: statusColor(t) }} />
                            <span className="min-w-0 flex-1 truncate">{t.title}</span>
                            <span className="hidden text-xs text-muted-foreground md:inline">{t.labels[0]}</span>
                            <PriorityTag priority={t.priority} compact />
                            <Points value={t.points} />
                            <span className="w-14">
                              <DueTag due={t.due} />
                            </span>
                            <Avatar member={assignee} size={22} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-primary">
        <span>
          {dragging
            ? `↕ Перенос ${dragging.key}${overTask && overTask.id !== dragging.id ? ` · Отпустите над ${overTask.key}, чтобы изменить порядок` : ""}`
            : `${project.name}`}
        </span>
        <span className="text-muted-foreground">Порядок: вручную</span>
      </div>

      <Modal open={epicDialog} onClose={() => setEpicDialog(false)} title="Новый эпик">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!epicName.trim()) return;
            addEpic(epicName);
            setEpicName("");
            setEpicDialog(false);
          }}
          className="space-y-4"
        >
          <input
            autoFocus
            value={epicName}
            onChange={(e) => setEpicName(e.target.value)}
            placeholder="Название эпика"
            className="field"
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setEpicDialog(false)}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={!epicName.trim()}>
              Создать эпик
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
