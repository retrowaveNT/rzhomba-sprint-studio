import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronDown, Circle, CircleDot } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/rz";

const LAUNCH = [
  { label: "Библиотека компонентов", status: "Готово", kind: "done" },
  { label: "Фильтры на доске", status: "В работе", kind: "progress" },
  { label: "Вход через Google", status: "К работе", kind: "todo" },
] as const;

export function AuthLayout({
  topText,
  topLink,
  topTo,
  children,
}: {
  topText: string;
  topLink: string;
  topTo: "/login" | "/signup";
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-[40%] max-w-[560px] min-w-[380px] flex-col justify-between bg-surface p-8 lg:flex">
        <Logo />

        <div className="max-w-md">
          <p className="eyebrow mb-4">Меньше шума. Больше движения.</p>
          <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight">
            Общий фокус.
            <br />
            Заметный прогресс.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Задачи, команда и следующий большой запуск — в одном спокойном рабочем пространстве.
          </p>

          <div className="mt-8 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">Запуск платформы</span>
              <span className="text-muted-foreground">Спринт 12</span>
            </div>
            <ul className="mt-3 space-y-2.5">
              {LAUNCH.map((l) => (
                <li key={l.label} className="flex items-center gap-2.5 text-[13px]">
                  {l.kind === "done" && <Check className="h-4 w-4 text-[var(--success)]" />}
                  {l.kind === "progress" && <CircleDot className="h-4 w-4 text-primary" />}
                  {l.kind === "todo" && <Circle className="h-4 w-4 text-primary" />}
                  <span className="flex-1">{l.label}</span>
                  <span className="text-[11px] text-muted-foreground">{l.status}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
              Одна команда. Понятный ритм.
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © 2026 Ржомба · Создано для команд, которые делают
        </p>
      </div>

      <div className="flex flex-1 flex-col border-l border-border">
        <div className="flex items-center justify-between px-8 py-6 text-[13px]">
          <span className="text-muted-foreground">{topText}</span>
          <Link to={topTo} className="link inline-flex items-center gap-1">
            {topLink} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-[350px]">{children}</div>
        </div>

        <div className="flex items-center justify-center gap-6 px-8 py-6 text-xs text-muted-foreground">
          <button className="hover:text-foreground" onClick={() => toast("Справка пока недоступна")}>
            Помощь
          </button>
          <button className="hover:text-foreground" onClick={() => toast("Политика конфиденциальности пока недоступна")}>
            Конфиденциальность
          </button>
          <button
            className="inline-flex items-center gap-1 hover:text-foreground"
            onClick={() => toast("Пока доступен только русский язык")}
          >
            Русский <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-secondary w-full py-2.5">
      <Circle className="h-3.5 w-3.5" />
      Продолжить с Google
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      или через почту
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
