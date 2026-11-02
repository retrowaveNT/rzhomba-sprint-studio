import { SNAPSHOT } from "@/lib/store";

interface Props {
  start: string;
  end: string;
  total: number;
  /** Остаток SP на срез (если спринт активен). */
  remaining?: number;
  height?: number;
}

function dayIndex(iso: string, from: string) {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${iso}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86400000);
}

function lab(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  const names = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  return `${d} ${names[(m ?? 1) - 1]}`;
}

/** Схема burndown: промежуточные точки иллюстративные, срез — реальный. */
export function Burndown({ start, end, total, remaining, height = 170 }: Props) {
  const W = 560;
  const H = height;
  const padL = 28;
  const padB = 22;
  const padT = 8;
  const days = Math.max(dayIndex(end, start), 1);
  const x = (d: number) => padL + (d / days) * (W - padL - 6);
  const max = Math.max(total, 1);
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const snapDay = Math.min(Math.max(dayIndex(SNAPSHOT, start), 0), days);
  const hasFact = remaining !== undefined;

  let fact = "";
  if (hasFact) {
    const r = remaining ?? total;
    const steps: [number, number][] = [
      [0, total],
      [Math.max(snapDay * 0.45, 0), total],
      [Math.max(snapDay * 0.45, 0), total - (total - r) * 0.45],
      [Math.max(snapDay * 0.8, 0), total - (total - r) * 0.45],
      [Math.max(snapDay * 0.8, 0), r],
      [snapDay, r],
    ];
    fact = steps.map(([d, v], i) => `${i === 0 ? "M" : "L"}${x(d)},${y(v)}`).join(" ");
  }

  const ticks = [max, Math.round(max * 0.8), Math.round(max * 0.4), 0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="График burndown">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - 6} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
          <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize={9} fill="var(--muted-foreground)">
            {t}
          </text>
        </g>
      ))}
      <line
        x1={x(0)}
        y1={y(total)}
        x2={x(days)}
        y2={y(0)}
        stroke="var(--muted-foreground)"
        strokeWidth={1.2}
        strokeDasharray="4 4"
      />
      {hasFact && <path d={fact} fill="none" stroke="var(--primary)" strokeWidth={2} />}
      <text x={padL} y={H - 6} fontSize={9} fill="var(--muted-foreground)">
        {lab(start)}
      </text>
      {hasFact && (
        <text x={x(snapDay)} y={H - 6} fontSize={9} textAnchor="middle" fill="var(--primary)">
          {lab(SNAPSHOT)} · срез
        </text>
      )}
      <text x={W - 6} y={H - 6} fontSize={9} textAnchor="end" fill="var(--muted-foreground)">
        {lab(end)}
      </text>
    </svg>
  );
}
