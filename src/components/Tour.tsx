import { ArrowRight, X } from "lucide-react";

import { useStore } from "@/lib/store";

const STEPS = [
  {
    title: "Первая задача — первый шаг",
    text: "Создайте задачу, назначьте исполнителя и перетащите карточку в нужную колонку.",
  },
  {
    title: "Следите за лимитами WIP",
    text: "Колонка подсветится, когда в работе слишком много задач. Лимиты настраиваются в «Настройках доски».",
  },
  {
    title: "Спросите ИИ-ассистента",
    text: "Он видит контекст задачи и спринта и подскажет, что осталось сделать.",
  },
];

export function Tour() {
  const { tourStep, setTourStep } = useStore();
  if (tourStep < 1 || tourStep > STEPS.length) return null;
  const step = STEPS[tourStep - 1]!;
  const last = tourStep === STEPS.length;
  return (
    <div
      role="dialog"
      aria-label="Быстрый старт"
      className="fixed top-24 right-8 z-30 w-[300px] rounded-xl bg-[oklch(0.24_0.03_285)] p-4 text-white shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-wider text-white/60 uppercase">
          Быстрый старт · {tourStep} / {STEPS.length}
        </span>
        <button onClick={() => setTourStep(0)} aria-label="Закрыть тур" className="text-white/60 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <h3 className="mt-2 text-[15px] font-semibold">{step.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-white/70">{step.text}</p>
      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => setTourStep(0)} className="text-xs text-white/60 hover:text-white">
          Пропустить
        </button>
        <button
          onClick={() => setTourStep(last ? 0 : tourStep + 1)}
          className="btn btn-primary px-3 py-1.5 text-xs"
        >
          {last ? "Готово" : "Далее"} {!last && <ArrowRight className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
