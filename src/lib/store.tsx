import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  EPICS,
  INITIAL_COLUMNS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ROLES,
  INITIAL_TASKS,
  MEMBERS,
  ME_ID,
  PROJECTS,
  SAMPLE_TASKS,
  SPRINTS,
  type Column,
  type Epic,
  type Member,
  type Notification,
  type Priority,
  type Project,
  type Role,
  type Sprint,
  type Task,
} from "./seed";

export * from "./seed";

export interface Filters {
  assignees: string[];
  priorities: Priority[];
  labels: string[];
  sprint: string | null;
}

export const EMPTY_FILTERS: Filters = { assignees: [], priorities: [], labels: [], sprint: null };

export interface Profile {
  first: string;
  last: string;
  email: string;
  position: string;
  tz: string;
  avatarUrl: string | null;
  notifyMentions: boolean;
  notifyAssigned: boolean;
  notifyDigest: boolean;
}

export function applyFilters(tasks: Task[], f: Filters): Task[] {
  return tasks.filter(
    (t) =>
      (f.assignees.length === 0 || f.assignees.includes(t.assigneeId)) &&
      (f.priorities.length === 0 || f.priorities.includes(t.priority)) &&
      (f.labels.length === 0 || f.labels.some((l) => t.labels.includes(l))) &&
      (f.sprint === null || t.sprintId === f.sprint),
  );
}

export function filtersActive(f: Filters): boolean {
  return f.assignees.length + f.priorities.length + f.labels.length > 0 || f.sprint !== null;
}

export interface NewTaskInput {
  title: string;
  status?: string;
  priority?: Priority;
  assigneeId?: string;
  points?: number;
  epicId?: string | null;
  sprintId?: string | null;
  labels?: string[];
  description?: string;
  due?: string | null;
}

interface StoreValue {
  projects: Project[];
  project: Project;
  setProject: (id: string) => void;
  createProject: (input: {
    name: string;
    key: string;
    description: string;
    mode: "kanban" | "scrum";
  }) => void;
  members: Member[];
  roles: Record<string, Role>;
  setRole: (memberId: string, role: Role) => void;
  removeMember: (memberId: string) => void;
  transferOwnership: (memberId: string) => void;
  tasks: Task[];
  allTasks: Task[];
  epics: Epic[];
  addEpic: (name: string) => void;
  sprints: Sprint[];
  activeSprint: Sprint | null;
  addSprint: () => void;
  updateSprint: (id: string, patch: Partial<Sprint>) => void;
  completeSprint: (id: string) => void;
  columns: Column[];
  saveColumns: (cols: Column[]) => void;
  wipWarning: boolean;
  setWipWarning: (v: boolean) => void;
  notifications: Notification[];
  markAllRead: () => void;
  markRead: (id: string) => void;
  profile: Profile;
  saveProfile: (p: Profile) => void;
  patchProfile: (p: Partial<Profile>) => void;
  moveTask: (id: string, status: string, opts?: { silent?: boolean }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  addTask: (input: NewTaskInput) => Task | null;
  toggleCheck: (taskId: string, itemId: string, list?: "checklist" | "subtasks") => void;
  addComment: (taskId: string, text: string) => void;
  applySubtasks: (taskId: string, texts: string[]) => void;
  reorderTask: (id: string, beforeId: string | null, epicId?: string | null) => void;
  assignSprint: (id: string, sprintId: string | null) => void;
  seedSamples: () => void;
  mode: "kanban" | "scrum";
  setMode: (m: "kanban" | "scrum") => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  selectedTask: Task | null;
  selectedId: string | null;
  contextTaskId: string | null;
  openTask: (id: string) => void;
  closeTask: () => void;
  aiOpen: boolean;
  setAiOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  createOpen: { status?: string } | null;
  setCreateOpen: (v: { status?: string } | null) => void;
  helpOpen: boolean;
  setHelpOpen: (v: boolean) => void;
  tourStep: number;
  setTourStep: (n: number) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const TOUR_KEY = "rzhomba-tour-done";

function nextKeyFor(pid: string, list: Task[], projs: Project[]): string {
  const prefix = projs.find((p) => p.id === pid)?.key ?? "TSK";
  const max = list
    .filter((t) => t.projectId === pid)
    .reduce((acc, t) => Math.max(acc, Number(t.key.split("-")[1] ?? 0)), 0);
  return `${prefix}-${max + 1}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [projectId, setProjectId] = useState("plt");
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [roles, setRoles] = useState<Record<string, Role>>(INITIAL_ROLES);
  const [allTasks, setAllTasks] = useState<Task[]>(INITIAL_TASKS);
  const [epics, setEpics] = useState<Epic[]>(EPICS);
  const [sprints, setSprints] = useState<Sprint[]>(SPRINTS);
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [wipWarning, setWipWarning] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextTaskId, setContextTaskId] = useState<string | null>("plt124");
  const [aiOpen, setAiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState<{ status?: string } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourStep, setTourStepState] = useState(0);
  const [profile, setProfile] = useState<Profile>({
    first: "Анна",
    last: "Ким",
    email: "anna@studio.team",
    position: "Product designer",
    tz: "Москва · UTC+3",
    avatarUrl: null,
    notifyMentions: true,
    notifyAssigned: true,
    notifyDigest: false,
  });

  const project = projects.find((p) => p.id === projectId) ?? projects[0]!;
  const mode = project.mode;

  const tasksRef = useRef(allTasks);
  tasksRef.current = allTasks;
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const wipRef = useRef(wipWarning);
  wipRef.current = wipWarning;
  const membersRef = useRef(members);
  membersRef.current = members;

  const me = members.find((m) => m.id === ME_ID) ?? MEMBERS[0]!;

  // Тур «Быстрый старт» показываем один раз, пока его не пропустят или не завершат.
  useEffect(() => {
    try {
      if (localStorage.getItem(TOUR_KEY) !== "1") setTourStepState(1);
    } catch {
      setTourStepState(1);
    }
  }, []);

  const setTourStep = useCallback((n: number) => {
    setTourStepState(n);
    if (n === 0) {
      try {
        localStorage.setItem(TOUR_KEY, "1");
      } catch {
        // ignore
      }
    }
  }, []);

  // Состояние соединения: «Нет соединения. Черновик сохранён. Повторить».
  useEffect(() => {
    const onOffline = () =>
      toast.warning("Нет соединения. Черновик сохранён.", {
        action: {
          label: "Повторить",
          onClick: () =>
            navigator.onLine
              ? toast.success("Соединение восстановлено")
              : toast.warning("Соединения всё ещё нет"),
        },
      });
    const onOnline = () => toast.success("Соединение восстановлено");
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const tasks = useMemo(
    () => allTasks.filter((t) => t.projectId === projectId),
    [allTasks, projectId],
  );

  const projectSprints = useMemo(
    () => sprints.filter((s) => s.projectId === projectId),
    [sprints, projectId],
  );
  const activeSprint = projectSprints.find((s) => s.state === "active") ?? null;
  const projectEpics = useMemo(
    () => epics.filter((e) => e.projectId === projectId),
    [epics, projectId],
  );

  const setProject = useCallback(
    (id: string) => {
      setProjectId(id);
      const proj = projects.find((p) => p.id === id);
      const active = sprints.find((s) => s.projectId === id && s.state === "active");
      setFilters({
        ...EMPTY_FILTERS,
        sprint: proj?.mode === "scrum" ? (active?.id ?? null) : null,
      });
      setSelectedId(null);
    },
    [projects, sprints],
  );

  const setMode = useCallback(
    (m: "kanban" | "scrum") => {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, mode: m } : p)));
      const active = sprints.find((s) => s.projectId === projectId && s.state === "active");
      setFilters((f) => ({ ...f, sprint: m === "scrum" ? (active?.id ?? null) : null }));
    },
    [projectId, sprints],
  );

  const createProject = useCallback(
    (input: { name: string; key: string; description: string; mode: "kanban" | "scrum" }) => {
      const id = `p${Date.now()}`;
      setProjects((prev) => [
        ...prev,
        {
          id,
          name: input.name,
          key: input.key,
          description: input.description,
          color: "violet",
          mode: input.mode,
          members: members.length,
          favorite: true,
        },
      ]);
      setProjectId(id);
      setFilters(EMPTY_FILTERS);
      setTourStepState(1);
      try {
        localStorage.removeItem(TOUR_KEY);
      } catch {
        // ignore
      }
    },
    [members.length],
  );

  const addTask = useCallback(
    (input: NewTaskInput): Task | null => {
      const title = input.title.trim();
      if (!title) return null;
      const cols = columnsRef.current;
      const key = nextKeyFor(projectId, tasksRef.current, projects);
      const task: Task = {
        id: `t${Date.now()}${Math.floor(Math.random() * 1000)}`,
        projectId,
        key,
        title,
        description: input.description ?? "",
        status: input.status ?? cols[0]?.id ?? "todo",
        priority: input.priority ?? "medium",
        assigneeId: input.assigneeId ?? ME_ID,
        points: input.points ?? 1,
        labels: input.labels ?? [],
        epicId: input.epicId ?? null,
        sprintId: input.sprintId ?? null,
        due: input.due ?? null,
        checklist: [],
        subtasks: [],
        attachments: [],
        comments: [],
        history: [{ id: `h${Date.now()}`, text: `Только что · ${me.name} создал(а) задачу`, time: "" }],
      };
      setAllTasks((prev) => [...prev, task]);
      toast.success(`Задача ${key} создана`);
      return task;
    },
    [projectId, projects, me.name],
  );

  const moveTask = useCallback((id: string, status: string, opts?: { silent?: boolean }) => {
    const cur = tasksRef.current.find((t) => t.id === id);
    if (!cur || cur.status === status) return;
    const cols = columnsRef.current;
    const fromCol = cols.find((c) => c.id === cur.status);
    const toCol = cols.find((c) => c.id === status);
    if (!toCol) return;
    const myName = membersRef.current.find((m) => m.id === ME_ID)?.name ?? "";
    const entry = {
      id: `h${Date.now()}`,
      text: `Только что · ${myName}: ${fromCol?.name ?? cur.status} → ${toCol.name}`,
      time: "",
    };
    setAllTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, history: [entry, ...t.history] } : t)),
    );
    if (!opts?.silent) {
      toast.success(`Задача ${cur.key} обновлена`, {
        action: {
          label: "Отменить",
          onClick: () => moveTask(id, cur.status, { silent: true }),
        },
      });
    }
    if (toCol.wip != null && wipRef.current) {
      const count =
        tasksRef.current.filter((t) => t.projectId === cur.projectId && t.status === status)
          .length + 1;
      if (count > toCol.wip) {
        toast.warning(`Лимит WIP превышен: «${toCol.name}» · ${count} / ${toCol.wip}`);
      }
    }
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setAllTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const toggleCheck = useCallback(
    (taskId: string, itemId: string, list: "checklist" | "subtasks" = "checklist") => {
      setAllTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, [list]: t[list].map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)) }
            : t,
        ),
      );
    },
    [],
  );

  const addComment = useCallback((taskId: string, text: string) => {
    setAllTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [
                ...t.comments,
                { id: `cm${Date.now()}`, authorId: ME_ID, text, time: "Только что" },
              ],
            }
          : t,
      ),
    );
  }, []);

  const applySubtasks = useCallback((taskId: string, texts: string[]) => {
    setAllTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [
                ...t.subtasks,
                ...texts.map((text, i) => ({ id: `st${Date.now()}${i}`, text, done: false })),
              ],
            }
          : t,
      ),
    );
    toast.success("Подзадачи добавлены");
  }, []);

  const reorderTask = useCallback((id: string, beforeId: string | null, epicId?: string | null) => {
    setAllTasks((prev) => {
      const moving = prev.find((t) => t.id === id);
      if (!moving || id === beforeId) return prev;
      const target = beforeId ? prev.find((t) => t.id === beforeId) : undefined;
      const updated: Task = {
        ...moving,
        epicId: epicId !== undefined ? epicId : (target?.epicId ?? moving.epicId),
      };
      const rest = prev.filter((t) => t.id !== id);
      const idx = beforeId ? rest.findIndex((t) => t.id === beforeId) : -1;
      if (idx === -1) return [...rest, updated];
      return [...rest.slice(0, idx), updated, ...rest.slice(idx)];
    });
  }, []);

  const assignSprint = useCallback((id: string, sprintId: string | null) => {
    setAllTasks((prev) => prev.map((t) => (t.id === id ? { ...t, sprintId } : t)));
  }, []);

  const seedSamples = useCallback(() => {
    const first = columnsRef.current[0]?.id ?? "todo";
    let list = tasksRef.current;
    const added: Task[] = SAMPLE_TASKS.map((s, i) => {
      const task: Task = {
        id: `t${Date.now()}${i}`,
        projectId,
        key: nextKeyFor(projectId, list, projects),
        title: s.title,
        description: "",
        status: first,
        priority: s.priority,
        assigneeId: ME_ID,
        points: s.points,
        labels: s.labels,
        epicId: null,
        sprintId: null,
        due: null,
        checklist: [],
        subtasks: [],
        attachments: [],
        comments: [],
        history: [],
      };
      list = [...list, task];
      return task;
    });
    setAllTasks((prev) => [...prev, ...added]);
  }, [projectId, projects]);

  const addEpic = useCallback(
    (name: string) => {
      const n = name.trim();
      if (!n) return;
      setEpics((prev) => [...prev, { id: `e${Date.now()}`, projectId, name: n }]);
      toast.success(`Эпик «${n}» создан`);
    },
    [projectId],
  );

  const addSprint = useCallback(() => {
    const mine = sprints.filter((s) => s.projectId === projectId);
    const num =
      mine.reduce((acc, s) => Math.max(acc, Number(s.name.replace(/\D/g, "")) || 0), 0) + 1;
    const last = mine.reduce((acc, s) => (s.end > acc ? s.end : acc), "2026-10-23");
    const d = new Date(`${last}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 3);
    const start = d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 11);
    const end = d.toISOString().slice(0, 10);
    setSprints((prev) => [
      ...prev,
      { id: `s${Date.now()}`, projectId, name: `Спринт ${num}`, goal: "", start, end, state: "planned" },
    ]);
    toast.success(`Спринт ${num} создан`);
  }, [sprints, projectId]);

  const updateSprint = useCallback((id: string, patch: Partial<Sprint>) => {
    setSprints((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const completeSprint = useCallback(
    (id: string) => {
      const doneIds = new Set(columnsRef.current.filter((c) => c.type === "done").map((c) => c.id));
      const unfinished = tasksRef.current.filter(
        (t) => t.sprintId === id && !doneIds.has(t.status),
      );
      const target = sprints.find((s) => s.id === id);
      const next = sprints
        .filter((s) => s.projectId === target?.projectId && s.state === "planned")
        .sort((a, b) => a.start.localeCompare(b.start))[0];
      setSprints((prev) =>
        prev.map((s): Sprint => {
          if (s.id === id) return { ...s, state: "completed" };
          if (next && s.id === next.id) return { ...s, state: "active" };
          return s;
        }),
      );
      const ids = new Set(unfinished.map((u) => u.id));
      setAllTasks((prev) =>
        prev.map((t) => (ids.has(t.id) ? { ...t, sprintId: next?.id ?? null } : t)),
      );
      setFilters((f) => (f.sprint === id ? { ...f, sprint: next?.id ?? null } : f));
      toast.success(
        unfinished.length > 0
          ? `Спринт завершён. Незакрытых задач: ${unfinished.length} — перенесены дальше`
          : "Спринт завершён",
      );
    },
    [sprints],
  );

  const saveColumns = useCallback((cols: Column[]) => {
    setColumns(cols);
    toast.success("Настройки доски сохранены");
  }, []);

  const setRole = useCallback((memberId: string, role: Role) => {
    setRoles((prev) => ({ ...prev, [memberId]: role }));
    toast.success("Роль обновлена");
  }, []);

  const removeMember = useCallback((memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    setRoles((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
    toast.success("Участник удалён из проекта");
  }, []);

  const transferOwnership = useCallback((memberId: string) => {
    setRoles((prev) => {
      const next: Record<string, Role> = { ...prev };
      for (const k of Object.keys(next)) if (next[k] === "owner") next[k] = "admin";
      next[memberId] = "owner";
      return next;
    });
    toast.success("Владение передано");
  }, []);

  const markAllRead = useCallback(
    () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    [],
  );
  const markRead = useCallback(
    (id: string) =>
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
    [],
  );

  const saveProfile = useCallback((p: Profile) => {
    setProfile(p);
    setMembers((prev) =>
      prev.map((m) =>
        m.id === ME_ID ? { ...m, name: `${p.first} ${p.last}`.trim(), email: p.email } : m,
      ),
    );
    toast.success("Профиль сохранён");
  }, []);
  const patchProfile = useCallback(
    (p: Partial<Profile>) => setProfile((prev) => ({ ...prev, ...p })),
    [],
  );

  const openTask = useCallback((id: string) => {
    setSelectedId(id);
    setContextTaskId(id);
  }, []);
  const closeTask = useCallback(() => setSelectedId(null), []);

  const selectedTask = allTasks.find((t) => t.id === selectedId) ?? null;

  const value: StoreValue = {
    projects,
    project,
    setProject,
    createProject,
    members,
    roles,
    setRole,
    removeMember,
    transferOwnership,
    tasks,
    allTasks,
    epics: projectEpics,
    addEpic,
    sprints: projectSprints,
    activeSprint,
    addSprint,
    updateSprint,
    completeSprint,
    columns,
    saveColumns,
    wipWarning,
    setWipWarning,
    notifications,
    markAllRead,
    markRead,
    profile,
    saveProfile,
    patchProfile,
    moveTask,
    updateTask,
    addTask,
    toggleCheck,
    addComment,
    applySubtasks,
    reorderTask,
    assignSprint,
    seedSamples,
    mode,
    setMode,
    filters,
    setFilters,
    selectedTask,
    selectedId,
    contextTaskId,
    openTask,
    closeTask,
    aiOpen,
    setAiOpen,
    searchOpen,
    setSearchOpen,
    createOpen,
    setCreateOpen,
    helpOpen,
    setHelpOpen,
    tourStep,
    setTourStep,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// ---------------------------------------------------------------- тема

export type ThemeChoice = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "rzhomba-theme";

function applyTheme(choice: ThemeChoice) {
  const dark =
    choice === "dark" ||
    (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") setThemeState(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return { theme, setTheme };
}
