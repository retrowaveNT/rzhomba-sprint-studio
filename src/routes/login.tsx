import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout, GoogleButton, OrDivider } from "@/components/AuthLayout";
import { StatePanel } from "@/components/rz";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Вход — Ржомба" },
      { name: "description", content: "Войдите в Ржомбу, чтобы продолжить работу с командой." },
      { property: "og:title", content: "Вход — Ржомба" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length === 0) {
      setError(true);
      return;
    }
    setError(false);
    setBusy(true);
    window.setTimeout(() => navigate({ to: "/board" }), 400);
  };

  return (
    <AuthLayout topText="Ещё нет аккаунта?" topLink="Создать аккаунт" topTo="/signup">
      <h2 className="text-[26px] font-semibold tracking-tight">С возвращением</h2>
      <p className="mt-2 mb-6 text-[13px] text-muted-foreground">
        Войдите, чтобы продолжить работу с командой.
      </p>

      <GoogleButton onClick={() => navigate({ to: "/board" })} />
      <OrDivider />

      {error && (
        <StatePanel
          variant="error"
          title="Почта или пароль не совпадают"
          text="Проверьте данные или восстановите пароль."
          action="Восстановить пароль"
          onAction={() => toast("Ссылка для восстановления отправлена на почту")}
          className="mb-4"
        />
      )}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium">
            Рабочая почта
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.ru"
            aria-invalid={error}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium">
            Пароль
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              aria-invalid={error}
              className="field pl-9"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Запомнить меня
          </label>
          <button
            type="button"
            className="link"
            onClick={() => toast("Ссылка для восстановления отправлена на почту")}
          >
            Забыли пароль?
          </button>
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary w-full py-2.5">
          {busy ? "Входим…" : "Войти"}
        </button>
      </form>
    </AuthLayout>
  );
}
