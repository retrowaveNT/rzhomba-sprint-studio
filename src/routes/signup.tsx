import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState } from "react";

import { AuthLayout, GoogleButton, OrDivider } from "@/components/AuthLayout";
import { StatePanel } from "@/components/rz";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Регистрация — Ржомба" },
      { name: "description", content: "Создайте аккаунт в Ржомбе и соберите команду." },
      { property: "og:title", content: "Регистрация — Ржомба" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SignupPage,
});

// Почта, которая «уже зарегистрирована» — для демонстрации ошибочного состояния.
const TAKEN_EMAIL = "anna@studio.team";

function validPassword(p: string) {
  return p.length >= 8 && /[A-Za-zА-Яа-яЁё]/.test(p) && /\d/.test(p);
}

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [taken, setTaken] = useState(false);
  const [busy, setBusy] = useState(false);

  const nameErr = submitted && name.trim().length === 0;
  const emailErr = submitted && !/^\S+@\S+\.\S+$/.test(email);
  const passErr = submitted && !validPassword(password);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTaken(false);
    if (name.trim().length === 0 || !/^\S+@\S+\.\S+$/.test(email) || !validPassword(password)) return;
    if (email.toLowerCase() === TAKEN_EMAIL) {
      setTaken(true);
      return;
    }
    setBusy(true);
    window.setTimeout(() => navigate({ to: "/onboarding" }), 400);
  };

  return (
    <AuthLayout topText="Уже есть аккаунт?" topLink="Войти" topTo="/login">
      <h2 className="text-[26px] font-semibold tracking-tight">Начните с ясности</h2>
      <p className="mt-2 mb-6 text-[13px] text-muted-foreground">
        Создайте аккаунт. Соберите команду. Начните делать.
      </p>

      <GoogleButton onClick={() => navigate({ to: "/onboarding" })} />
      <OrDivider />

      {taken && (
        <StatePanel
          variant="error"
          title="Эта почта уже зарегистрирована"
          text="Войдите или используйте другую почту."
          action="Войти"
          onAction={() => navigate({ to: "/login" })}
          className="mb-4"
        />
      )}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium">
            Ваше имя
          </label>
          <input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя и фамилия"
            aria-invalid={nameErr}
            className="field"
          />
          {nameErr && <p className="mt-1 text-xs text-destructive">Укажите имя</p>}
        </div>
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
            aria-invalid={emailErr}
            className="field"
          />
          {emailErr && <p className="mt-1 text-xs text-destructive">Введите корректную почту</p>}
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Придумайте пароль"
              aria-invalid={passErr}
              className="field pl-9"
            />
          </div>
          <p className={passErr ? "mt-1.5 text-xs text-destructive" : "mt-1.5 text-xs text-muted-foreground"}>
            Минимум 8 символов, буквы и цифры.
          </p>
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary w-full py-2.5">
          {busy ? "Создаём аккаунт…" : "Создать аккаунт"}
        </button>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Создавая аккаунт, вы принимаете{" "}
          <Link to="/signup" className="underline">
            Условия использования
          </Link>{" "}
          и{" "}
          <Link to="/signup" className="underline">
            Политику конфиденциальности
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}
