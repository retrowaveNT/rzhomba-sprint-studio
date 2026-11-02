import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GripVertical, MoreHorizontal, Plus, Search, UserPlus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { InviteDialog } from "@/components/Overlays";
import { Avatar, Popover, Toggle } from "@/components/rz";
import {
  COLUMN_TYPE_LABELS,
  ROLE_LABELS,
  useStore,
  useTheme,
  type Column,
  type ColumnType,
  type Role,
  type ThemeChoice,
} from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "members" | "board" | "profile";

export const Route = createFileRoute("/_shell/settings")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => ({
    tab: s.tab === "board" || s.tab === "profile" || s.tab === "members" ? s.tab : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Настройки — Ржомба" },
      { name: "description", content: "Участники, колонки доски и профиль." },
      { property: "og:title", content: "Настройки — Ржомба" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const tab: Tab = Route.useSearch().tab ?? "members";
  const navigate = useNavigate();
  const { project } = useStore();
  const tabs: { v: Tab; label: string }[] = [
    { v: "members", label: "Участники и роли" },
    { v: "board", label: "Настройки доски" },
    { v: "profile", label: "Мой профиль" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Настройки</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {project.name} · управление проектом и личными предпочтениями
        </p>
      </div>
      <div className="flex gap-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.v}
            role="tab"
            aria-selected={tab === t.v}
            aria-pressed={tab === t.v}
            className="btn btn-secondary"
            onClick={() => navigate({ to: "/settings", search: { tab: t.v } })}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "members" && <Members />}
      {tab === "board" && <BoardSettings />}
      {tab === "profile" && <ProfileTab />}
    </div>
  );
}

// ------------------------------------------------------------ участники

const ROLE_DESC: { role: Role; text: string }[] = [
  { role: "admin", text: "Участники, настройки и все задачи проекта." },
  { role: "member", text: "Создание, редактирование и обсуждение задач." },
  { role: "viewer", text: "Чтение проекта и комментарии без изменения задач." },
];

function Members() {
  const { members, roles, setRole, removeMember, transferOwnership } = useStore();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [menu, setMenu] = useState<string | null>(null);
  const [invite, setInvite] = useState(false);

  const list = members.filter(
    (m) =>
      (roleFilter === "all" || roles[m.id] === roleFilter) &&
      `${m.name} ${m.email}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold">Участники и роли</h2>
          <p className="text-xs text-muted-foreground">{members.length} участников · доступ только к этому проекту</p>
        </div>
        <button className="btn btn-primary" onClick={() => setInvite(true)}>
          <UserPlus className="h-3.5 w-3.5" />
          Пригласить участника
        </button>
      </div>
      <div className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти по имени или почте…" className="field pl-9" />
        </div>
        <select
          aria-label="Фильтр по роли"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
          className="field w-44"
        >
          <option value="all">Все роли</option>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[1fr_140px_200px_40px] gap-3 border-b border-border px-5 py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          <span>Участник</span>
          <span>Доступ</span>
          <span>Роль в проекте</span>
          <span />
        </div>
        {list.map((m) => {
          const role = roles[m.id] ?? "member";
          const owner = role === "owner";
          return (
            <div key={m.id} className="grid grid-cols-[1fr_140px_200px_40px] items-center gap-3 border-b border-border px-5 py-3 last:border-0">
              <div className="flex items-center gap-3">
                <Avatar member={m} size={32} />
                <div>
                  <p className="text-[13px] font-medium">
                    {m.name}
                    {m.id === "ak" && " (вы)"}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                Активен
              </span>
              {owner ? (
                <span className="field cursor-not-allowed text-center text-muted-foreground opacity-60">Владелец</span>
              ) : (
                <select
                  aria-label={`Роль: ${m.name}`}
                  value={role}
                  onChange={(e) => setRole(m.id, e.target.value as Role)}
                  className="field"
                >
                  <option value="admin">{ROLE_LABELS.admin}</option>
                  <option value="member">{ROLE_LABELS.member}</option>
                  <option value="viewer">{ROLE_LABELS.viewer}</option>
                </select>
              )}
              <div className="relative">
                <button
                  aria-label={`Действия: ${m.name}`}
                  disabled={owner}
                  onClick={() => setMenu(menu === m.id ? null : m.id)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <Popover open={menu === m.id} onClose={() => setMenu(null)} align="right" className="w-52 p-1.5">
                  <button
                    className="w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
                    onClick={() => {
                      setMenu(null);
                      if (window.confirm(`Передать владение проектом: ${m.name}?`)) transferOwnership(m.id);
                    }}
                  >
                    Передать владение
                  </button>
                  <button
                    className="w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-destructive hover:bg-muted"
                    onClick={() => {
                      setMenu(null);
                      if (window.confirm(`Удалить ${m.name} из проекта?`)) removeMember(m.id);
                    }}
                  >
                    Удалить из проекта
                  </button>
                </Popover>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="px-5 py-8 text-center text-xs text-muted-foreground">Участники не найдены</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {ROLE_DESC.map((r) => (
          <div key={r.role} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[13px] font-semibold">{ROLE_LABELS[r.role]}</p>
            <p className="mt-1 text-xs text-muted-foreground">{r.text}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Владельца нельзя удалить или понизить в роли. Передайте владение в меню участника.
      </p>
      <InviteDialog open={invite} onClose={() => setInvite(false)} />
    </div>
  );
}

// ---------------------------------------------------------- колонки доски

function BoardSettings() {
  const { columns, saveColumns, tasks, wipWarning, setWipWarning } = useStore();
  const [draft, setDraft] = useState<Column[]>(columns);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [warn, setWarn] = useState(wipWarning);
  const [menu, setMenu] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(columns) || warn !== wipWarning;
  const valid = draft.every((c) => c.name.trim().length > 0) && draft.some((c) => c.type === "done");

  const patch = (id: string, p: Partial<Column>) => setDraft((d) => d.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const count = (id: string) => tasks.filter((t) => t.status === id).length;

  const previewCol = draft.find((c) => c.wip != null && count(c.id) >= c.wip);
  const previewN = previewCol && previewCol.wip != null ? count(previewCol.id) + 1 : 0;

  const move = (to: number) => {
    if (dragIdx === null || dragIdx === to) return;
    setDraft((d) => {
      const next = [...d];
      const [item] = next.splice(dragIdx, 1);
      if (item) next.splice(to, 0, item);
      return next;
    });
    setDragIdx(to);
  };

  const add = () =>
    setDraft((d) => [
      ...d,
      { id: `col${Date.now()}`, name: "Новая колонка", type: "in_progress", wip: null, color: "var(--info)" },
    ]);

  const remove = (c: Column) => {
    if (count(c.id) > 0) {
      toast.error("Нельзя удалить колонку, в которой есть задачи. Сначала перенесите их.");
      return;
    }
    if (draft.length <= 2) {
      toast.error("На доске должно быть минимум две колонки");
      return;
    }
    setDraft((d) => d.filter((x) => x.id !== c.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold">Колонки доски</h2>
          <p className="text-xs text-muted-foreground">
            Порядок колонок определяет движение задач. Перетащите строку, чтобы изменить его.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={add}>
          <Plus className="h-3.5 w-3.5" />
          Добавить колонку
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[24px_1fr_160px_110px_190px_32px] gap-3 border-b border-border px-4 py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          <span />
          <span>Название колонки</span>
          <span>Тип статуса</span>
          <span>WIP-лимит</span>
          <span>Сейчас в колонке</span>
          <span />
        </div>
        {draft.map((c, i) => {
          const n = count(c.id);
          const full = c.wip != null && n >= c.wip;
          return (
            <div
              key={c.id}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => {
                e.preventDefault();
                move(i);
              }}
              onDragEnd={() => setDragIdx(null)}
              className={cn(
                "grid grid-cols-[24px_1fr_160px_110px_190px_32px] items-center gap-3 border-b border-border px-4 py-2.5 last:border-0",
                dragIdx === i && "bg-accent/60",
              )}
            >
              <GripVertical className="h-3.5 w-3.5 cursor-grab text-muted-foreground" />
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                <input
                  aria-label="Название колонки"
                  value={c.name}
                  onChange={(e) => patch(c.id, { name: e.target.value })}
                  aria-invalid={c.name.trim() === ""}
                  className="field"
                />
              </div>
              <select
                aria-label="Тип статуса"
                value={c.type}
                onChange={(e) => patch(c.id, { type: e.target.value as ColumnType })}
                className="field"
              >
                {(Object.keys(COLUMN_TYPE_LABELS) as ColumnType[]).map((t) => (
                  <option key={t} value={t}>
                    {COLUMN_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <input
                aria-label="WIP-лимит"
                inputMode="numeric"
                placeholder="—"
                value={c.wip ?? ""}
                disabled={c.type !== "in_progress"}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  patch(c.id, { wip: v === "" ? null : Math.max(1, Number(v)) });
                }}
                className="field text-center"
              />
              <span className={cn("text-xs", full ? "text-destructive" : "text-muted-foreground")}>
                {c.wip != null ? `${n} / ${c.wip}${full ? " · лимит достигнут" : ""}` : `${n} ${n === 1 ? "задача" : n >= 2 && n <= 4 ? "задачи" : "задач"}`}
              </span>
              <div className="relative">
                <button
                  aria-label="Действия с колонкой"
                  onClick={() => setMenu(menu === c.id ? null : c.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <Popover open={menu === c.id} onClose={() => setMenu(null)} align="right" className="w-44 p-1.5">
                  <button
                    className="w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-destructive hover:bg-muted"
                    onClick={() => {
                      setMenu(null);
                      remove(c);
                    }}
                  >
                    Удалить колонку
                  </button>
                </Popover>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-[13px] font-semibold">Поведение при превышении WIP</h3>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium">Показывать предупреждение</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Перенос разрешён. Переполненная колонка выделяется, команда видит превышение.
              </p>
            </div>
            <Toggle on={warn} onChange={setWarn} label="Показывать предупреждение о превышении WIP" />
          </div>
          <p className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
            — Без лимита · Лимит считается по количеству задач, а не по SP.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-[13px] font-semibold">Предпросмотр переполнения</h3>
          {previewCol && previewCol.wip != null ? (
            <>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {previewCol.name} · {previewN} / {previewCol.wip}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                WIP превышен на {previewN - previewCol.wip} {previewN - previewCol.wip === 1 ? "задачу" : "задач"}. Завершите
                текущую работу перед добавлением новой.
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Лимиты не заданы или ещё не достигнуты.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">Изменения применяются ко всем участникам проекта.</p>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary"
            disabled={!dirty}
            onClick={() => {
              setDraft(columns);
              setWarn(wipWarning);
            }}
          >
            Отмена
          </button>
          <button
            className="btn btn-primary"
            disabled={!dirty || !valid}
            onClick={() => {
              saveColumns(draft.map((c) => ({ ...c, name: c.name.trim(), wip: c.type === "in_progress" ? c.wip : null })));
              setWipWarning(warn);
            }}
          >
            Сохранить изменения
          </button>
        </div>
      </div>
      {!valid && <p className="text-xs text-destructive">Укажите названия колонок и оставьте хотя бы одну колонку типа «Завершено».</p>}
    </div>
  );
}

// ------------------------------------------------------------------ профиль

const TZ = ["Москва · UTC+3", "Калининград · UTC+2", "Екатеринбург · UTC+5", "Новосибирск · UTC+7", "Владивосток · UTC+10"];
const THEME_CARDS: { v: ThemeChoice; label: string; bg: string; bar: string }[] = [
  { v: "light", label: "Светлая", bg: "bg-white", bar: "bg-neutral-200" },
  { v: "dark", label: "Тёмная", bg: "bg-neutral-900", bar: "bg-neutral-600" },
  { v: "system", label: "Система", bg: "bg-gradient-to-r from-white to-neutral-900", bar: "bg-neutral-400" },
];

function ProfileTab() {
  const { profile, saveProfile, patchProfile, members } = useStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState(profile);
  const fileRef = useRef<HTMLInputElement>(null);
  const me = members.find((m) => m.id === "ak");
  const emailOk = /^\S+@\S+\.\S+$/.test(form.email);
  const valid = form.first.trim() !== "" && emailOk;
  const dirty = JSON.stringify(form) !== JSON.stringify(profile);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) saveProfile(form);
        }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <h2 className="mb-4 text-base font-semibold">Мой профиль</h2>
        <div className="mb-4 flex items-center gap-3">
          <Avatar member={me} size={48} src={form.avatarUrl} />
          <div>
            <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              Изменить фото
            </button>
            <p className="mt-1 text-[11px] text-muted-foreground">JPG, PNG · до 5 МБ</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > 5 * 1024 * 1024) {
                toast.error("Файл больше 5 МБ");
                return;
              }
              set("avatarUrl", URL.createObjectURL(f));
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-[13px] font-medium">
            <span className="mb-1.5 block">Имя</span>
            <input className="field" value={form.first} onChange={(e) => set("first", e.target.value)} aria-invalid={form.first.trim() === ""} />
          </label>
          <label className="block text-[13px] font-medium">
            <span className="mb-1.5 block">Фамилия</span>
            <input className="field" value={form.last} onChange={(e) => set("last", e.target.value)} />
          </label>
        </div>
        <label className="mt-4 block text-[13px] font-medium">
          <span className="mb-1.5 block">Рабочая почта</span>
          <input className="field" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!emailOk} />
          {!emailOk && <span className="mt-1 block text-xs font-normal text-destructive">Введите корректную почту</span>}
        </label>
        <label className="mt-4 block text-[13px] font-medium">
          <span className="mb-1.5 block">Должность</span>
          <input className="field" value={form.position} onChange={(e) => set("position", e.target.value)} />
        </label>
        <label className="mt-4 block text-[13px] font-medium">
          <span className="mb-1.5 block">Часовой пояс</span>
          <select className="field" value={form.tz} onChange={(e) => set("tz", e.target.value)}>
            {TZ.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-[11px] text-muted-foreground">Видно участникам Studio team</span>
          <button type="submit" className="btn btn-primary" disabled={!dirty || !valid}>
            Сохранить
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">Оформление</h2>
          <p className="mt-1 text-xs text-muted-foreground">Выберите тему. Настройка применяется только к вашему аккаунту.</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {THEME_CARDS.map((t) => (
              <button
                key={t.v}
                type="button"
                aria-pressed={theme === t.v}
                onClick={() => setTheme(t.v)}
                className="text-center text-xs"
              >
                <span
                  className={cn(
                    "block rounded-lg border-2 p-2",
                    t.bg,
                    theme === t.v ? "border-primary" : "border-border",
                  )}
                >
                  <span className={cn("mb-1.5 block h-1.5 w-8 rounded", t.bar)} />
                  <span className={cn("block h-6 rounded", t.bar, "opacity-60")} />
                </span>
                <span className="mt-1.5 block">{t.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Выбрана {theme === "light" ? "светлая тема" : theme === "dark" ? "тёмная тема" : "системная тема"} · сохранено
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold">Уведомления</h2>
          <ul className="space-y-3 text-[13px]">
            {(
              [
                ["notifyMentions", "Упоминания и комментарии"],
                ["notifyAssigned", "Изменения назначенных мне задач"],
                ["notifyDigest", "Итоги спринта по почте"],
              ] as const
            ).map(([k, label]) => (
              <li key={k} className="flex items-center justify-between">
                <span>{label}</span>
                <Toggle on={profile[k]} onChange={(v) => patchProfile({ [k]: v })} label={label} />
              </li>
            ))}
          </ul>
        </div>

        <button className="link text-[13px] !text-destructive" onClick={() => navigate({ to: "/login" })}>
          Выйти из аккаунта →
        </button>
      </div>
    </div>
  );
}
