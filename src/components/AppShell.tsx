import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Diamond,
  Folder,
  HelpCircle,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  Repeat,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserPlus,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AiAssistant } from "@/components/AiAssistant";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import {
  HelpDialog,
  InviteDialog,
  NotificationsPopover,
  ProfileMenu,
  ProjectSwitcher,
  SearchPalette,
} from "@/components/Overlays";
import { Avatar, Logo } from "@/components/rz";
import { TaskDrawer } from "@/components/TaskDrawer";
import { MEMBERS, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/board", label: "Доска", icon: LayoutGrid },
  { to: "/backlog", label: "Бэклог", icon: ListChecks },
  { to: "/sprints", label: "Спринты", icon: Repeat },
  { to: "/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/settings", label: "Настройки", icon: SlidersHorizontal },
] as const;

function isTyping(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  return (
    t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable
  );
}

export function AppShell() {
  const {
    aiOpen,
    setAiOpen,
    setSearchOpen,
    setCreateOpen,
    setHelpOpen,
    notifications,
    projects,
    setProject,
    project,
    members,
    profile,
  } = useStore();
  const path = useRouterState().location.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;
  const me = members.find((m) => m.id === "ak") ?? MEMBERS[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key.toLowerCase() === "n" || e.key === "т" || e.key === "Т") {
        e.preventDefault();
        setCreateOpen({});
      } else if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen, setCreateOpen, setHelpOpen]);

  const navItem = (item: (typeof NAV)[number]) => {
    const active = path.startsWith(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg py-2 text-[13px] font-medium transition-colors",
          collapsed ? "justify-center px-0" : "px-3",
          active
            ? "bg-accent text-accent-foreground"
            : "text-foreground/80 hover:bg-muted hover:text-foreground",
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && item.label}
      </Link>
    );
  };

  const projectsBtn = (
    <button
      type="button"
      onClick={() => setSwitcherOpen(true)}
      title={collapsed ? "Проекты" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg py-2 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground",
        collapsed ? "justify-center px-0" : "px-3",
      )}
    >
      <Folder className="h-4 w-4 shrink-0" />
      {!collapsed && "Проекты"}
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-border bg-surface transition-[width]",
          collapsed ? "w-14" : "w-[216px]",
        )}
      >
        <div className={cn("pt-5 pb-4", collapsed ? "flex justify-center" : "px-4")}>
          <Link to="/board" aria-label="Ржомба">
            <Logo size={26} withName={!collapsed} />
          </Link>
        </div>

        {!collapsed && (
          <div className="mb-3 px-4">
            <button className="flex items-center gap-1 text-xs font-medium">
              Studio team <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            <p className="text-[11px] text-muted-foreground">Pro · {members.length} участников</p>
          </div>
        )}

        <nav className="space-y-0.5 px-2.5">
          {projectsBtn}
          {NAV.map(navItem)}
        </nav>

        {!collapsed && (
          <div className="mt-6 px-4">
            <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">ИЗБРАННОЕ</p>
            <ul className="space-y-0.5">
              {projects
                .filter((p) => p.favorite)
                .map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setProject(p.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs hover:bg-muted",
                        p.id === project.id ? "font-semibold text-foreground" : "text-foreground/75",
                      )}
                    >
                      <Diamond className="h-3 w-3 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        <div className="mt-auto space-y-2 p-3">
          {!collapsed && (
            <>
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="btn btn-secondary w-full"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Пригласить команду
              </button>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="h-3 w-3" />
                Помощь и сочетания клавиш
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-6 py-2.5">
          <ProjectSwitcher open={switcherOpen} setOpen={setSwitcherOpen} />
          <div className="ml-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex w-64 items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-accent"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1">Поиск в проекте</span>
              <span className="text-[11px]">⌘ K</span>
            </button>
            <button
              type="button"
              onClick={() => setAiOpen(!aiOpen)}
              aria-pressed={aiOpen}
              className="btn btn-secondary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              ИИ-ассистент
            </button>
            <NotificationsPopover
              open={notifOpen}
              setOpen={setNotifOpen}
              trigger={
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label={`Уведомления: ${unread} непрочитанных`}
                  aria-expanded={notifOpen}
                  className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                      {unread}
                    </span>
                  )}
                </button>
              }
            />
            <ProfileMenu
              open={profileOpen}
              setOpen={setProfileOpen}
              trigger={
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label="Профиль"
                  aria-expanded={profileOpen}
                  className="rounded-full"
                >
                  <Avatar member={me} size={28} src={profile.avatarUrl} />
                </button>
              }
            />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
            <Outlet />
          </main>
          {aiOpen && <AiAssistant />}
        </div>
      </div>

      <TaskDrawer />
      <SearchPalette />
      <HelpDialog />
      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <CreateTaskDialog />
    </div>
  );
}
