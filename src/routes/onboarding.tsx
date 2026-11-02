import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Diamond, Layers, Repeat, Sparkles, UserPlus, CheckCircle2, Columns3 } from "lucide-react";
import { useState } from "react";

import { Avatar, Logo } from "@/components/rz";
import { MEMBERS, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Первый проект — Ржомба" },
      { name: "description", content: "Создайте первый проект и выберите способ планирования." },
      { property: "og:title", content: "Первый проект — Ржомба" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Onboarding,
});

const COLORS = ["Фиолетовый", "Синий", "Зелёный", "Оранжевый"];

function makeKey(name: string) {
  const letters = name.replace(/[^A-Za-zА-Яа-яЁё]/g, "").toUpperCase();
  return letters.slice(0, 3);
}

function Onboarding() {
  const navigate = useNavigate();
  const { createProject, profile } = useStore();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [color, setColor] = useState(COLORS[0]!);
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"kanban" | "scrum">("kanban");
  const [access, setAccess] = useState("Вся команда Studio team");
  const [submitted, setSubmitted] = useState(false);

  const me = MEMBERS[0];
  const nameErr = submitted && name.trim().length === 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (name.trim().length === 0) return;
    createProject({
      name: name.trim(),
      key: (key || makeKey(name) || "PRJ").toUpperCase(),
      description: description.trim(),
      mode,
    });
    navigate({ to: "/board" });
  };

  const BENEFITS = [
    { icon: CheckCircle2, title: "Соберите всё в одном месте", text: "Задачи, файлы и обсуждения рядом." },
    { icon: UserPlus, title: "Пригласите свою команду", text: "У каждого будет понятный следующий шаг." },
    { icon: Sparkles, title: "Остальное поможем настроить", text: "На доске вас ждёт короткий тур." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="relative flex items-center justify-between px-8 py-5">
        <Logo />
        <span className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          Настройка рабочего пространства · 1 из 2
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {me && <Avatar member={me} size={22} />}
          {profile.first} {profile.last}
          <ChevronDown className="h-3 w-3" />
        </span>
      </header>

      <main className="mx-auto grid max-w-[1000px] gap-16 px-8 pt-14 pb-16 md:grid-cols-[minmax(0,420px)_1fr]">
        <form onSubmit={submit} noValidate className="space-y-5">
          <div>
            <p className="eyebrow mb-3">Первый шаг</p>
            <h1 className="text-[28px] font-semibold tracking-tight">Дайте идеям пространство</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Создайте первый проект. Название и способ работы можно будет изменить в настройках.
            </p>
          </div>

          <div>
            <label htmlFor="pname" className="mb-1.5 block text-[13px] font-medium">
              Название проекта
            </label>
            <input
              id="pname"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!keyTouched) setKey(makeKey(e.target.value));
              }}
              placeholder="Например, Платформа 2.0"
              aria-invalid={nameErr}
              className="field"
            />
            {nameErr && <p className="mt-1 text-xs text-destructive">Введите название проекта</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pkey" className="mb-1.5 block text-[13px] font-medium">
                Ключ проекта
              </label>
              <input
                id="pkey"
                value={key}
                maxLength={5}
                onChange={(e) => {
                  setKeyTouched(true);
                  setKey(e.target.value.toUpperCase());
                }}
                placeholder="PLT"
                className="field"
              />
            </div>
            <div>
              <label htmlFor="pcolor" className="mb-1.5 block text-[13px] font-medium">
                Иконка и цвет
              </label>
              <select
                id="pcolor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="field"
              >
                {COLORS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="pdesc" className="mb-1.5 block text-[13px] font-medium">
              Описание
            </label>
            <input
              id="pdesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Обновляем рабочее пространство команды"
              className="field"
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium">Как вы планируете работу?</legend>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { v: "kanban", icon: Columns3, title: "Kanban", text: "Непрерывный поток задач" },
                  { v: "scrum", icon: Repeat, title: "Scrum", text: "Спринты, оценки и цель итерации" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={mode === o.v}
                  onClick={() => setMode(o.v)}
                  className={cn(
                    "relative rounded-xl border p-3 text-left transition-colors",
                    mode === o.v
                      ? "border-primary/50 bg-accent"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <o.icon className="mb-2 h-4 w-4 text-primary" />
                  <span className="block text-[13px] font-semibold">{o.title}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{o.text}</span>
                  <span
                    className={cn(
                      "absolute top-3 right-3 h-3 w-3 rounded-full border",
                      mode === o.v ? "border-primary bg-primary" : "border-input",
                    )}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="paccess" className="mb-1.5 block text-[13px] font-medium">
              Доступ к проекту
            </label>
            <select
              id="paccess"
              value={access}
              onChange={(e) => setAccess(e.target.value)}
              className="field"
            >
              <option>Вся команда Studio team</option>
              <option>Только приглашённые</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary w-full py-2.5">
            <ArrowRight className="h-4 w-4" />
            Создать проект
          </button>
        </form>

        <aside className="hidden pt-24 md:block">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
            <Layers className="h-6 w-6" />
          </span>
          <h2 className="text-xl leading-snug font-semibold">
            Большое начинается
            <br />с первого проекта
          </h2>
          <ul className="mt-5 space-y-4">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-3">
                <b.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-[13px] font-semibold">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Diamond className="h-3 w-3" />
            Без сложных настроек. Можно начать сразу.
          </p>
        </aside>
      </main>
    </div>
  );
}
