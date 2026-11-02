export type Priority = "low" | "medium" | "high";
export type ColumnType = "not_started" | "in_progress" | "done";
export type Role = "owner" | "admin" | "member" | "viewer";

export interface Member {
  id: string;
  name: string;
  initials: string;
  email: string;
  hue: number;
}

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  wip: number | null;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  meta: string;
  kind: "figma" | "pdf";
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  time: string;
}

export interface HistoryEntry {
  id: string;
  text: string;
  time: string;
}

export interface Task {
  id: string;
  projectId: string;
  key: string;
  title: string;
  description: string;
  status: string;
  priority: Priority;
  assigneeId: string;
  points: number;
  labels: string[];
  epicId: string | null;
  sprintId: string | null;
  /** ISO date, e.g. 2026-10-16 */
  due: string | null;
  checklist: ChecklistItem[];
  subtasks: ChecklistItem[];
  attachments: Attachment[];
  comments: Comment[];
  history: HistoryEntry[];
}

export interface Epic {
  id: string;
  projectId: string;
  name: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  start: string;
  end: string;
  state: "active" | "planned" | "completed";
  note?: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  mode: "kanban" | "scrum";
  members: number;
  favorite: boolean;
}

export interface Notification {
  id: string;
  memberId: string;
  title: string;
  body: string;
  meta: string;
  taskId: string | null;
  read: boolean;
}

export const MONTHS_GEN = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
export const MONTHS_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

/** Дата «среза» из макета: аналитика и burndown считаются на неё. */
export const SNAPSHOT = "2026-10-16";
export const SNAPSHOT_LABEL = "16 октября, 18:00";

export function fmtShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[(m ?? 1) - 1]}`;
}

export function fmtLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_GEN[(m ?? 1) - 1]} ${y}`;
}

export type DueState = "ok" | "soon" | "overdue";
export function dueState(iso: string): DueState {
  if (iso < SNAPSHOT) return "overdue";
  if (iso === SNAPSHOT) return "soon";
  return "ok";
}

export const MEMBERS: Member[] = [
  { id: "ak", name: "Анна Ким", initials: "AK", email: "anna@studio.team", hue: 283 },
  { id: "dk", name: "Дмитрий Козлов", initials: "ДК", email: "dmitry@studio.team", hue: 65 },
  { id: "ms", name: "Мария Соколова", initials: "МС", email: "maria@studio.team", hue: 165 },
  { id: "iv", name: "Илья Волков", initials: "ИВ", email: "ilya@studio.team", hue: 250 },
  { id: "eo", name: "Елена Орлова", initials: "ЕО", email: "elena@studio.team", hue: 340 },
  { id: "ps", name: "Павел Смирнов", initials: "ПС", email: "pavel@studio.team", hue: 200 },
];

export const ME_ID = "ak";

export const INITIAL_ROLES: Record<string, Role> = {
  ak: "owner",
  dk: "admin",
  ms: "member",
  iv: "member",
  eo: "member",
  ps: "viewer",
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Владелец",
  admin: "Администратор",
  member: "Участник",
  viewer: "Наблюдатель",
};

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  not_started: "Не начато",
  in_progress: "В процессе",
  done: "Завершено",
};

export const INITIAL_COLUMNS: Column[] = [
  { id: "todo", name: "К работе", type: "not_started", wip: null, color: "var(--muted-foreground)" },
  { id: "in_progress", name: "В работе", type: "in_progress", wip: 3, color: "var(--warning)" },
  { id: "review", name: "На проверке", type: "in_progress", wip: 2, color: "oklch(0.65 0.17 283)" },
  { id: "done", name: "Готово", type: "done", wip: null, color: "var(--success)" },
];

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

export const PROJECTS: Project[] = [
  {
    id: "plt",
    name: "Платформа 2.0",
    key: "PLT",
    description: "Обновляем рабочее пространство команды",
    color: "violet",
    mode: "kanban",
    members: 6,
    favorite: true,
  },
  {
    id: "ds",
    name: "Дизайн-система",
    key: "DS",
    description: "Компоненты и токены",
    color: "violet",
    mode: "kanban",
    members: 3,
    favorite: true,
  },
  {
    id: "site",
    name: "Сайт студии",
    key: "WEB",
    description: "Маркетинговый сайт",
    color: "violet",
    mode: "kanban",
    members: 4,
    favorite: false,
  },
];

/** Количество задач в проектах, у которых в прототипе нет данных (из макета). */
export const PROJECT_TASK_COUNTS: Record<string, number> = { plt: 12, ds: 24, site: 8 };

export const EPICS: Epic[] = [
  { id: "workspace", projectId: "plt", name: "Рабочее пространство" },
  { id: "auth", projectId: "plt", name: "Авторизация" },
  { id: "notif", projectId: "plt", name: "Уведомления" },
];

export const SPRINTS: Sprint[] = [
  {
    id: "s12",
    projectId: "plt",
    name: "Спринт 12",
    goal: "Подготовить рабочее пространство к командной работе: фильтры, поиск и надёжная авторизация.",
    start: "2026-10-12",
    end: "2026-10-23",
    state: "active",
  },
  {
    id: "s13",
    projectId: "plt",
    name: "Спринт 13",
    goal: "",
    start: "2026-10-26",
    end: "2026-11-06",
    state: "planned",
  },
  {
    id: "s11",
    projectId: "plt",
    name: "Спринт 11",
    goal: "",
    start: "2026-09-28",
    end: "2026-10-09",
    state: "completed",
    note: "Архив · демонстрационный пример",
  },
];

export function fmtRange(start: string, end: string): string {
  const [, sm, sd] = start.split("-").map(Number);
  const [, em, ed] = end.split("-").map(Number);
  if (sm === em) return `${sd}–${ed} ${MONTHS_GEN[(em ?? 1) - 1]}`;
  return `${sd} ${MONTHS_GEN[(sm ?? 1) - 1]} – ${ed} ${MONTHS_GEN[(em ?? 1) - 1]}`;
}

export function fmtRangeYear(start: string, end: string): string {
  const year = end.split("-")[0];
  return `${fmtRange(start, end)} ${year}`;
}

function baseHistory(taskKey: string): HistoryEntry[] {
  return [{ id: `h-${taskKey}`, text: "14 окт, 15:30 · Анна Ким создала задачу", time: "" }];
}

function mk(
  n: number,
  title: string,
  status: string,
  priority: Priority,
  assigneeId: string,
  points: number,
  labels: string[],
  epicId: string,
  sprintId: string | null,
  due: string | null = null,
): Task {
  const key = `PLT-${n}`;
  return {
    id: `plt${n}`,
    projectId: "plt",
    key,
    title,
    description: "",
    status,
    priority,
    assigneeId,
    points,
    labels,
    epicId,
    sprintId,
    due,
    checklist: [],
    subtasks: [],
    attachments: [],
    comments: [],
    history: baseHistory(key),
  };
}

const t124: Task = {
  ...mk(124, "Реализовать фильтры на доске", "in_progress", "high", "ak", 5, ["Frontend", "UX"], "workspace", "s12", "2026-10-16"),
  description:
    "Команда должна быстро находить нужные задачи без потери контекста. Добавить фильтры по исполнителю, приоритету, меткам и спринту.\n**Логика:** между группами — И, внутри группы — ИЛИ.\nСохранять выбранные значения в URL. Сброс — одним действием.",
  checklist: [
    { id: "c1", text: "Множественный выбор исполнителей", done: true },
    { id: "c2", text: "Комбинация фильтров и сброс", done: true },
    { id: "c3", text: "Сохранение состояния в URL", done: false },
    { id: "c4", text: "Клавиатурная навигация и тесты", done: false },
  ],
  attachments: [
    { id: "a1", name: "Фильтры.fig", meta: "Figma · 1,2 МБ", kind: "figma" },
    { id: "a2", name: "Спецификация.pdf", meta: "PDF · 248 КБ", kind: "pdf" },
  ],
  comments: [
    { id: "cm1", authorId: "ms", text: "Макеты обновила. Для активных фильтров добавила счётчик.", time: "Сегодня, 10:24" },
    { id: "cm2", authorId: "ak", text: "Спасибо! Беру в работу. Сохранение в URL проверю отдельно.", time: "Сегодня, 10:38" },
  ],
  history: [
    { id: "h1", text: "Сегодня, 09:42 · Анна Ким: К работе → В работе", time: "" },
    { id: "h2", text: "14 окт, 16:10 · Дмитрий Козлов добавил задачу в Спринт 12", time: "" },
    { id: "h3", text: "14 окт, 15:30 · Анна Ким создала задачу", time: "" },
  ],
};

export const INITIAL_TASKS: Task[] = [
  mk(130, "Подготовить пустые состояния", "todo", "low", "ak", 2, ["Дизайн"], "workspace", "s12"),
  t124,
  mk(125, "Сохранять порядок задач при переносе", "in_progress", "high", "dk", 5, ["Backend"], "workspace", "s12"),
  mk(126, "Добавить поиск по проекту", "in_progress", "medium", "ms", 3, ["Frontend", "Поиск"], "workspace", "s12"),
  mk(121, "Проверить доступность навигации", "review", "medium", "ak", 2, ["UX", "A11y"], "workspace", "s12", "2026-10-16"),
  mk(122, "Покрыть API проектов тестами", "review", "medium", "dk", 3, ["Backend", "Тесты"], "workspace", "s12"),
  mk(118, "Собрать библиотеку компонентов", "done", "medium", "ak", 5, ["Дизайн"], "workspace", "s12"),
  mk(119, "Настроить окружение проекта", "done", "high", "dk", 2, ["DevOps"], "workspace", "s12"),
  mk(128, "Настроить вход через Google", "todo", "high", "dk", 5, ["Backend", "Авторизация"], "auth", "s12"),
  mk(129, "Добавить восстановление пароля", "todo", "medium", "ms", 3, ["Frontend", "Авторизация"], "auth", "s12"),
  mk(131, "Добавить центр уведомлений", "todo", "medium", "ms", 3, ["Frontend"], "notif", null),
  mk(132, "Настроить email-уведомления", "todo", "medium", "dk", 3, ["Backend"], "notif", null),
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    memberId: "ms",
    title: "Мария упомянула вас",
    body: "«Макеты обновила. @Анна, посмотри счётчик»",
    meta: "PLT-124 · 10:24",
    taskId: "plt124",
    read: false,
  },
  {
    id: "n2",
    memberId: "dk",
    title: "Задача ждёт проверки",
    body: "Покрыть API проектов тестами",
    meta: "PLT-122 · 09:50",
    taskId: "plt122",
    read: false,
  },
  {
    id: "n3",
    memberId: "ak",
    title: "Скоро срок задачи",
    body: "Реализовать фильтры на доске",
    meta: "PLT-124 · до 16 октября",
    taskId: "plt124",
    read: true,
  },
];

/** Задачи из соседнего проекта — только для демонстрации глобального поиска. */
export const FOREIGN_TASKS = [
  {
    key: "DS-042",
    title: "Компонент панели фильтров",
    status: "Готово",
    assignee: "Мария Соколова",
    project: "Дизайн-система",
  },
];

export const SAMPLE_TASKS = [
  { title: "Создать первую задачу", priority: "medium" as Priority, points: 1, labels: ["Старт"] },
  { title: "Пригласить команду", priority: "high" as Priority, points: 2, labels: ["Команда"] },
  { title: "Настроить колонки доски", priority: "low" as Priority, points: 2, labels: ["Доска"] },
];
