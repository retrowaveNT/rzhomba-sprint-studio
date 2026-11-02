import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Русское склонение: plural(5, ["задача", "задачи", "задач"]) → "задач". */
export function plural(n: number, forms: [string, string, string]): string {
  const m10 = Math.abs(n) % 10;
  const m100 = Math.abs(n) % 100;
  if (m100 >= 11 && m100 <= 14) return forms[2];
  if (m10 === 1) return forms[0];
  if (m10 >= 2 && m10 <= 4) return forms[1];
  return forms[2];
}
