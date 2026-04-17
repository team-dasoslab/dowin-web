import type { Options as ConfettiOptions } from "canvas-confetti";
import { toNumberId } from "@/lib/client/frontend-api";

export type CelebrationLevel = "single" | "all";
export type WeeklyCelebrationSnapshot = {
  completedCount: number;
  totalCount: number;
};
export type CelebrationEvent = {
  id: number;
  level: CelebrationLevel;
  measureName?: string;
};
type CelebrationLeadMeasure = {
  id?: string | number;
  name?: string | null;
  period?: string;
  targetValue?: number | null;
};
type CelebrationWeeklyValue = {
  achieved?: number | null;
};

export const DASHBOARD_CELEBRATION_CANVAS_ID =
  "dashboard-celebration-canvas";

export function ensureDashboardCelebrationCanvas(doc: Document) {
  const existingCanvas = doc.getElementById(
    DASHBOARD_CELEBRATION_CANVAS_ID,
  ) as HTMLCanvasElement | null;

  if (existingCanvas) {
    return existingCanvas;
  }

  const canvas = doc.createElement("canvas");
  canvas.id = DASHBOARD_CELEBRATION_CANVAS_ID;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";

  doc.body.appendChild(canvas);

  return canvas;
}

export function getDashboardCelebrationBursts(
  level: CelebrationLevel,
): ConfettiOptions[] {
  const bursts: ConfettiOptions[] = [
    {
      angle: 60,
      colors: ["#5e6ad2", "#84cc16", "#f59e0b", "#fb7185"],
      origin: { x: 0.14, y: 0.58 },
      particleCount: level === "all" ? 140 : 90,
      scalar: level === "all" ? 1.05 : 0.92,
      spread: level === "all" ? 68 : 54,
      startVelocity: level === "all" ? 56 : 46,
    },
    {
      angle: 120,
      colors: ["#22c55e", "#5e6ad2", "#fb7185", "#f59e0b"],
      origin: { x: 0.86, y: 0.58 },
      particleCount: level === "all" ? 140 : 90,
      scalar: level === "all" ? 1.05 : 0.92,
      spread: level === "all" ? 68 : 54,
      startVelocity: level === "all" ? 56 : 46,
    },
  ];

  if (level === "all") {
    bursts.push({
      angle: 90,
      colors: ["#5e6ad2", "#84cc16", "#f59e0b", "#fb7185", "#22c55e"],
      origin: { x: 0.5, y: 0.42 },
      particleCount: 110,
      scalar: 0.98,
      spread: 92,
      startVelocity: 44,
    });
  }

  return bursts;
}

export function getNextCelebrationEvent({
  activeLeadMeasures,
  nextSnapshot,
  previousSnapshot,
  previousCompletedMeasureIds,
  weeklyById,
}: {
  activeLeadMeasures: CelebrationLeadMeasure[];
  nextSnapshot: WeeklyCelebrationSnapshot;
  previousSnapshot: WeeklyCelebrationSnapshot | null;
  previousCompletedMeasureIds: Set<number>;
  weeklyById: Map<number | null, CelebrationWeeklyValue>;
}): CelebrationEvent | null {
  if (
    previousSnapshot === null ||
    nextSnapshot.totalCount === 0 ||
    nextSnapshot.completedCount <= previousSnapshot.completedCount
  ) {
    return null;
  }

  if (nextSnapshot.completedCount === nextSnapshot.totalCount) {
    return {
      id: Date.now(),
      level: "all",
    };
  }

  const newlyCompletedMeasure = activeLeadMeasures
    .filter((leadMeasure) => leadMeasure.period !== "MONTHLY")
    .find((leadMeasure) => {
      const leadMeasureId = toNumberId(leadMeasure.id);
      const targetValue = leadMeasure.targetValue ?? 0;
      const achieved = weeklyById.get(leadMeasureId)?.achieved ?? 0;

      return (
        leadMeasureId !== null &&
        !previousCompletedMeasureIds.has(leadMeasureId) &&
        targetValue > 0 &&
        achieved >= targetValue
      );
    });

  if (!newlyCompletedMeasure?.name) {
    return null;
  }

  return {
    id: Date.now(),
    level: "single",
    measureName: newlyCompletedMeasure.name,
  };
}

export function getCelebrationToastMessage(event: CelebrationEvent) {
  if (event.level === "all") {
    return "이번주 선행지표 100% 달성!";
  }

  return `이번주 ${event.measureName ?? "선행지표"} 100% 달성!`;
}

export function canPlayCelebration(
  event: CelebrationEvent | null,
  isLogPending: boolean,
): event is CelebrationEvent {
  return event !== null && !isLogPending;
}

export async function fireDashboardConfetti(level: CelebrationLevel) {
  if (typeof window === "undefined") {
    return;
  }

  const canvas = ensureDashboardCelebrationCanvas(document);
  const { create } = await import("canvas-confetti");
  const launch = create(canvas, {
    resize: true,
  });

  await Promise.all(
    getDashboardCelebrationBursts(level).map((burst) => launch(burst)),
  );
}
