import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock,
  Diamond,
  Flag,
  Inbox,
  Layers,
  RotateCcw,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from "react";

import { dueState, fmtShort, PRIORITY_LABELS, type Member, type Priority } from "@/lib/store";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------ бренд

export function Logo({ size = 28, withName = true }: { size?: number; withName?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground"
        style={{ width: size, height: size }}
      >
        <Layers style={{ width: size * 0.55, height: size * 0.55 }} />
      </span>
      {withName && <span className="text-lg font-semibold tracking-tight">Ржомба</span>}
    </span>
  );
}

// ---------------------------------------------------------------- аватары

export function Avatar({
  member,
  size = 24,
  src,
}: {
  member: Pick<Member, "initials" | "hue" | "name"> | undefined;
  size?: number;
  src?: string | null;
}) {
  if (!member) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground"
        style={{ width: size, height: size }}
      >
        ?
      </span>
    );
  }
  if (src) {
    return (
      <img
        src={src}
        alt={member.name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      title={member.name}
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.38),
        background: `oklch(0.7 0.1 ${member.hue} / 0.25)`,
        color: `oklch(0.5 0.14 ${member.hue})`,
      }}
    >
      {member.initials}
    </span>
  );
}

// -------------------------------------------------------------- приоритет

const PRIORITY_COLOR: Record<Priority, string> = {
  high: "text-[var(--warning)]",
  medium: "text-muted-foreground",
  low: "text-[var(--info)]",
};

export function PriorityTag({ priority, compact }: { priority: Priority; compact?: boolean }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-[11px] font-medium", PRIORITY_COLOR[priority])}
      title={`Приоритет: ${PRIORITY_LABELS[priority]}`}
    >
      <Flag className="h-3 w-3" />
      {!compact && PRIORITY_LABELS[priority]}
    </span>
  );
}

export function Points({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Story points">
      <Diamond className="h-3 w-3" />
      {value}
    </span>
  );
}

export function DueTag({ due }: { due: string | null }) {
  if (!due) return null;
  const state = dueState(due);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        state === "overdue" && "text-destructive",
        state === "soon" && "text-[var(--warning)]",
        state === "ok" && "text-muted-foreground",
      )}
    >
      <Clock className="h-3 w-3" />
      {fmtShort(due)}
    </span>
  );
}

// ---------------------------------------------------------------- попапы

export function useDismiss<T extends HTMLElement>(open: boolean, onClose: () => void): RefObject<T | null> {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return ref;
}

export function Popover({
  open,
  onClose,
  align = "left",
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  align?: "left" | "right";
  className?: string;
  children: ReactNode;
}) {
  const ref = useDismiss<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full z-50 mt-1.5 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl",
        align === "right" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface Option {
  value: string;
  label: string;
  leading?: ReactNode;
}

/** Фильтр-селект (Исполнитель / Приоритет / Метки / Спринт). */
export function FilterSelect({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  single,
}: {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  single?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => value.includes(o.value));
  const text =
    single && selected[0] && selected[0].value !== ""
      ? selected[0].label
      : selected.length > 0
        ? `${label} · ${selected.length}`
        : label;

  const toggle = (v: string) => {
    if (single) {
      onChange([v]);
      setOpen(false);
    } else {
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open || selected.length > 0}
        aria-haspopup="listbox"
        className="btn btn-secondary"
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {text}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className="w-56">
        <ul role="listbox" className="max-h-64 space-y-0.5 overflow-y-auto">
          {options.map((o) => {
            const on = value.includes(o.value);
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(o.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-muted",
                    on && "bg-accent text-accent-foreground",
                  )}
                >
                  {!single && (
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border border-input",
                        on && "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {on && <Check className="h-3 w-3" />}
                    </span>
                  )}
                  {o.leading}
                  <span className="flex-1 truncate">{o.label}</span>
                  {single && on && <Check className="h-3.5 w-3.5" />}
                </button>
              </li>
            );
          })}
        </ul>
        {!single && value.length > 0 && (
          <div className="mt-1 flex justify-between border-t border-border pt-2">
            <button type="button" className="link px-1 text-xs" onClick={() => onChange([])}>
              Сбросить
            </button>
            <button type="button" className="btn btn-primary px-3 py-1" onClick={() => setOpen(false)}>
              Применить
            </button>
          </div>
        )}
      </Popover>
    </div>
  );
}

// -------------------------------------------------------------- контролы

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        on ? "bg-primary" : "bg-input",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
          on ? "left-[1.125rem]" : "left-0.5",
        )}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted p-0.5" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1 text-[13px] font-medium transition-colors",
            value === o.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  color = "var(--primary)",
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[11px] text-muted-foreground">
      {children}
    </kbd>
  );
}

// -------------------------------------------------------------- модалка

export function Modal({
  open,
  onClose,
  title,
  width = "28rem",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: string;
  children: ReactNode;
}) {
  const ref = useDismiss<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/35 px-4 pt-[12vh]">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full rounded-2xl border border-border bg-card p-5 shadow-2xl"
        style={{ maxWidth: width }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="btn btn-secondary btn-icon border-transparent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ----------------------------------------------- состояния: empty/loading/error

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn("skeleton h-7", i === 0 && "h-4 w-1/3")} />
      ))}
      <p className="pt-1 text-xs text-muted-foreground">Загружаем данные…</p>
    </div>
  );
}

export function StatePanel({
  variant,
  title,
  text,
  action,
  onAction,
  actionIcon,
  className,
}: {
  variant: "empty" | "error";
  title: string;
  text?: string;
  action?: string;
  onAction?: () => void;
  actionIcon?: boolean;
  className?: string;
}) {
  const Icon = variant === "error" ? AlertTriangle : Inbox;
  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className={cn("rounded-xl border border-border bg-card p-5", className)}
    >
      <Icon
        className={cn("mb-3 h-5 w-5", variant === "error" ? "text-destructive" : "text-muted-foreground")}
      />
      <p className="text-sm font-semibold">{title}</p>
      {text && <p className="mt-1 text-xs text-muted-foreground">{text}</p>}
      {action && (
        <button
          type="button"
          onClick={onAction}
          className={cn("btn mt-3", variant === "error" ? "btn-secondary" : "btn-primary")}
        >
          {variant === "error" && actionIcon !== false && <RotateCcw className="h-3.5 w-3.5" />}
          {action}
        </button>
      )}
    </div>
  );
}
