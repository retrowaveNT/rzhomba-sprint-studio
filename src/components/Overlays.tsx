import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Diamond, Monitor, Moon, Plus, Search, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, Kbd, Modal, Popover } from "@/components/rz";
import {
  FOREIGN_TASKS,
  MEMBERS,
  PROJECT_TASK_COUNTS,
  ROLE_LABELS,
  useStore,
  useTheme,
  type ThemeChoice,
} from "@/lib/store";
import { cn, plural } from "@/lib/utils";

// ------------------------------------------------------ переключатель проектов

export function ProjectSwitcher({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { projects, project, setProject, allTasks } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const list = projects.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="btn btn-secondary border-transparent bg-transparent text-[13px]"
      >
        <Diamond className="h-3.5 w-3.5" />
        {project.name}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className="w-80 p-3">
        <p className="mb-2 text-sm font-semibold">Проекты Studio team</p>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Найти проект…"
            className="field pl-9"
            autoFocus
          />
        </div>
        <p className="eyebrow mb-1.5 text-muted-foreground">Избранное</p>
        <ul className="space-y-1">
          {list.map((p) => {
            const count =
              PROJECT_TASK_COUNTS[p.id] ?? allTasks.filter((t) => t.projectId === p.id).length;
            const current = p.id === project.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setProject(p.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-muted",
                    current && "bg-accent text-accent-foreground",
                  )}
                >
                  <Diamond className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{p.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {count} {plural(count, ["задача", "задачи", "задач"])} · {p.members}{" "}
                      {plural(p.members, ["участник", "участника", "участников"])}
                    </span>
                  </span>
                  {current && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              </li>
            );
          })}
          {list.length === 0 && (
            <li className="px-3 py-4 text-center text-xs text-muted-foreground">Проекты не найдены</li>
          )}
        </ul>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            navigate({ to: "/onboarding" });
          }}
          className="btn btn-secondary mt-3 w-full"
        >
          <Plus className="h-3.5 w-3.5" />
          Создать проект
        </button>
      </Popover>
    </div>
  );
}

// ------------------------------------------------------------- уведомления

export function NotificationsPopover({
  open,
  setOpen,
  trigger,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  trigger: React.ReactNode;
}) {
  const { notifications, markAllRead, markRead, openTask, allTasks, setProject, project } = useStore();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const unread = notifications.filter((n) => !n.read).length;
  const list = tab === "all" ? notifications : notifications.filter((n) => !n.read);

  return (
    <div className="relative">
      {trigger}
      <Popover open={open} onClose={() => setOpen(false)} align="right" className="w-[22rem] p-4">
        <h3 className="text-base font-semibold">Уведомления · {unread}</h3>
        <div className="mt-2 mb-3 flex items-center gap-3 text-xs">
          <button
            className={cn("link", tab !== "all" && "text-muted-foreground")}
            onClick={() => setTab("all")}
          >
            Все
          </button>
          <button
            className={cn("link", tab !== "unread" && "text-muted-foreground")}
            onClick={() => setTab("unread")}
          >
            Непрочитанные
          </button>
          <button className="link ml-auto" onClick={markAllRead} disabled={unread === 0}>
            Прочитать все ✓
          </button>
        </div>
        <ul className="space-y-1">
          {list.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  markRead(n.id);
                  const t = allTasks.find((x) => x.id === n.taskId);
                  if (t) {
                    if (t.projectId !== project.id) setProject(t.projectId);
                    openTask(t.id);
                  }
                  setOpen(false);
                }}
                className="flex w-full gap-3 rounded-lg p-2 text-left hover:bg-muted"
              >
                <Avatar member={MEMBERS.find((m) => m.id === n.memberId)} size={26} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                    {n.title}
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                  <span className="block text-[11px] text-primary">{n.meta}</span>
                </span>
              </button>
            </li>
          ))}
          {list.length === 0 && (
            <li className="py-6 text-center text-xs text-muted-foreground">Непрочитанных нет</li>
          )}
        </ul>
      </Popover>
    </div>
  );
}

// ------------------------------------------------------------------ профиль

const THEMES: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
  { value: "system", label: "Система", icon: Monitor },
];

export function ProfileMenu({
  open,
  setOpen,
  trigger,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  trigger: React.ReactNode;
}) {
  const { members, profile, setHelpOpen } = useStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const me = members.find((m) => m.id === "ak");

  const item = "w-full rounded-lg px-2 py-2 text-left text-[13px] hover:bg-muted";

  return (
    <div className="relative">
      {trigger}
      <Popover open={open} onClose={() => setOpen(false)} align="right" className="w-72 p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar member={me} size={40} src={profile.avatarUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {profile.first} {profile.last}
            </p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <button
          className={item}
          onClick={() => {
            setOpen(false);
            navigate({ to: "/settings", search: { tab: "profile" } });
          }}
        >
          Мой профиль
        </button>
        <button
          className={item}
          onClick={() => {
            setOpen(false);
            navigate({ to: "/settings", search: { tab: "members" } });
          }}
        >
          Настройки аккаунта
        </button>
        <button
          className={item}
          onClick={() => {
            setOpen(false);
            setHelpOpen(true);
          }}
        >
          Сочетания клавиш
        </button>
        <p className="mt-3 mb-1.5 px-2 text-[11px] text-muted-foreground">Оформление</p>
        <div className="mb-3 flex gap-1.5 px-1">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={theme === t.value}
              onClick={() => setTheme(t.value)}
              className="btn btn-secondary flex-1 px-2 py-1.5 text-xs"
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          className="w-full rounded-lg px-2 py-2 text-left text-[13px] text-destructive hover:bg-muted"
          onClick={() => {
            setOpen(false);
            navigate({ to: "/login" });
          }}
        >
          Выйти из аккаунта →
        </button>
      </Popover>
    </div>
  );
}

// ---------------------------------------------------------- глобальный поиск

export function SearchPalette() {
  const { searchOpen, setSearchOpen, allTasks, project, setProject, openTask, columns, members } = useStore();
  const [q, setQ] = useState("");
  const [allProjects, setAllProjects] = useState(true);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setQ("");
      setIdx(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [searchOpen]);

  type Hit = {
    key: string;
    title: string;
    sub: string;
    taskId?: string;
    projectId?: string;
    foreign?: boolean;
  };

  const hits = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const own = allTasks
      .filter((t) => (allProjects || t.projectId === project.id))
      .filter((t) => t.title.toLowerCase().includes(needle) || t.key.toLowerCase().includes(needle))
      .map<Hit>((t) => ({
        key: t.key,
        title: t.title,
        sub: `${columns.find((c) => c.id === t.status)?.name ?? t.status} · ${
          members.find((m) => m.id === t.assigneeId)?.name ?? ""
        }`,
        taskId: t.id,
        projectId: t.projectId,
      }));
    const foreign = allProjects
      ? FOREIGN_TASKS.filter(
          (t) => t.title.toLowerCase().includes(needle) || t.key.toLowerCase().includes(needle),
        ).map<Hit>((t) => ({
          key: t.key,
          title: t.title,
          sub: `${t.status} · ${t.assignee}`,
          foreign: true,
          projectId: t.project,
        }))
      : [];
    return [...own, ...foreign];
  }, [q, allProjects, allTasks, project.id, columns, members]);

  const choose = (h: Hit | undefined) => {
    if (!h) return;
    if (h.foreign) {
      toast(`Задача ${h.key} находится в проекте «${h.projectId}»`);
    } else if (h.taskId) {
      if (h.projectId && h.projectId !== project.id) setProject(h.projectId);
      openTask(h.taskId);
    }
    setSearchOpen(false);
  };

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/35 px-4 pt-[14vh]">
      <div
        role="dialog"
        aria-label="Глобальный поиск"
        className="w-full max-w-[34rem] rounded-2xl border border-border bg-card p-4 shadow-2xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") setSearchOpen(false);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setIdx((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setIdx((i) => Math.max(i - 1, 0));
          }
          if (e.key === "Enter") choose(hits[idx]);
        }}
      >
        <p className="mb-2 text-sm font-semibold">Поиск в рабочем пространстве</p>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            placeholder="Введите ключ или название задачи"
            className="field border-primary py-2.5 pl-9"
          />
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs">
          <button className="link inline-flex items-center gap-1" onClick={() => setAllProjects((v) => !v)}>
            {allProjects ? "Все проекты" : "Этот проект"} <ChevronDown className="h-3 w-3" />
          </button>
          <span className="text-muted-foreground">·</span>
          <span className="link">Задачи</span>
        </div>

        {q.trim() === "" ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Начните вводить, чтобы найти задачу
          </p>
        ) : hits.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Ничего не найдено. Попробуйте другой запрос.
          </p>
        ) : (
          <>
            <p className="eyebrow mt-4 mb-2 text-muted-foreground">
              Задачи · {hits.length} {plural(hits.length, ["результат", "результата", "результатов"])}
            </p>
            <ul className="space-y-2">
              {hits.map((h, i) => (
                <li key={h.key}>
                  <button
                    type="button"
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => choose(h)}
                    className={cn(
                      "w-full rounded-xl p-3 text-left",
                      i === idx ? "bg-accent" : "bg-muted/60 hover:bg-muted",
                    )}
                  >
                    <span className="block text-[11px] text-muted-foreground">{h.key}</span>
                    <span className="block text-[13px] font-semibold">{h.title}</span>
                    <span className="block text-xs text-muted-foreground">{h.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> Выбрать · <Kbd>Enter</Kbd> Открыть · <Kbd>Esc</Kbd> Закрыть
        </p>
      </div>
    </div>
  );
}

// --------------------------------------------------------- помощь и инвайт

export function HelpDialog() {
  const { helpOpen, setHelpOpen } = useStore();
  const rows: [string, string][] = [
    ["N", "Новая задача"],
    ["/  или  ⌘K", "Поиск"],
    ["?", "Сочетания клавиш"],
    ["Esc", "Закрыть окно или панель"],
    ["Enter", "Создать задачу в быстром вводе"],
  ];
  return (
    <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Помощь и сочетания клавиш">
      <ul className="divide-y divide-border">
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between py-2.5 text-[13px]">
            <span>{v}</span>
            <Kbd>{k}</Kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [err, setErr] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title="Пригласить команду">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^\S+@\S+\.\S+$/.test(email)) {
            setErr(true);
            return;
          }
          toast.success(`Приглашение отправлено: ${email}`);
          setEmail("");
          setErr(false);
          onClose();
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="inv" className="mb-1.5 block text-[13px] font-medium">
            Рабочая почта
          </label>
          <input
            id="inv"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.ru"
            aria-invalid={err}
            className="field"
            autoFocus
          />
          {err && <p className="mt-1 text-xs text-destructive">Введите корректную почту</p>}
        </div>
        <div>
          <label htmlFor="invrole" className="mb-1.5 block text-[13px] font-medium">
            Роль в проекте
          </label>
          <select id="invrole" value={role} onChange={(e) => setRole(e.target.value)} className="field">
            <option value="admin">{ROLE_LABELS.admin}</option>
            <option value="member">{ROLE_LABELS.member}</option>
            <option value="viewer">{ROLE_LABELS.viewer}</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            Отправить приглашение
          </button>
        </div>
      </form>
    </Modal>
  );
}
