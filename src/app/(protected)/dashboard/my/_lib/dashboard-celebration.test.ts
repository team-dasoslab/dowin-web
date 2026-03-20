import {
  DASHBOARD_CELEBRATION_CANVAS_ID,
  canPlayCelebration,
  ensureDashboardCelebrationCanvas,
  getCelebrationToastMessage,
  getDashboardCelebrationBursts,
  getNextCelebrationEvent,
} from "@/app/(protected)/dashboard/my/_lib/dashboard-celebration";
import { describe, expect, it } from "vitest";

describe("dashboard celebration", () => {
  it("creates and reuses a fixed fullscreen canvas for confetti", () => {
    const firstCanvas = ensureDashboardCelebrationCanvas(document);
    const secondCanvas = ensureDashboardCelebrationCanvas(document);

    expect(firstCanvas).toBe(secondCanvas);
    expect(firstCanvas.id).toBe(DASHBOARD_CELEBRATION_CANVAS_ID);
    expect(firstCanvas).toHaveStyle({
      inset: "0",
      pointerEvents: "none",
      position: "fixed",
      zIndex: "9999",
    });
    expect(document.body.querySelectorAll(`#${DASHBOARD_CELEBRATION_CANVAS_ID}`))
      .toHaveLength(1);
  });

  it("uses stronger burst settings for all-clear celebration", () => {
    expect(getDashboardCelebrationBursts("single")).toHaveLength(2);
    expect(getDashboardCelebrationBursts("all")).toHaveLength(3);
    expect(getDashboardCelebrationBursts("all")[2]).toMatchObject({
      angle: 90,
      origin: { x: 0.5, y: 0.42 },
      particleCount: 110,
    });
  });

  it("builds a single-measure toast message with the completed measure name", () => {
    expect(
      getCelebrationToastMessage({
        id: 1,
        level: "single",
        measureName: "물 2L 마시기",
      }),
    ).toBe("이번주 물 2L 마시기 100% 달성!");
  });

  it("builds an all-clear toast message", () => {
    expect(
      getCelebrationToastMessage({
        id: 1,
        level: "all",
      }),
    ).toBe("이번주 선행지표 100% 달성!");
  });

  it("returns a single celebration event with the newly completed measure", () => {
    expect(
      getNextCelebrationEvent({
        activeLeadMeasures: [
          { id: 1, name: "아침 운동", period: "WEEKLY", targetValue: 3 },
          { id: 2, name: "저녁 독서", period: "WEEKLY", targetValue: 2 },
        ],
        nextSnapshot: { completedCount: 1, totalCount: 2 },
        previousSnapshot: { completedCount: 0, totalCount: 2 },
        previousCompletedMeasureIds: new Set<number>(),
        weeklyById: new Map([
          [1, { achieved: 3 }],
          [2, { achieved: 1 }],
        ]),
      }),
    ).toMatchObject({
      level: "single",
      measureName: "아침 운동",
    });
  });

  it("returns an all-clear celebration event when every weekly measure is complete", () => {
    expect(
      getNextCelebrationEvent({
        activeLeadMeasures: [
          { id: 1, name: "아침 운동", period: "WEEKLY", targetValue: 3 },
          { id: 2, name: "독서", period: "MONTHLY", targetValue: 10 },
        ],
        nextSnapshot: { completedCount: 1, totalCount: 1 },
        previousSnapshot: { completedCount: 0, totalCount: 1 },
        previousCompletedMeasureIds: new Set<number>(),
        weeklyById: new Map([[1, { achieved: 3 }]]),
      }),
    ).toMatchObject({
      level: "all",
    });
  });

  it("returns null when no measure newly completed", () => {
    expect(
      getNextCelebrationEvent({
        activeLeadMeasures: [
          { id: 1, name: "아침 운동", period: "WEEKLY", targetValue: 3 },
        ],
        nextSnapshot: { completedCount: 0, totalCount: 1 },
        previousSnapshot: { completedCount: 0, totalCount: 1 },
        previousCompletedMeasureIds: new Set<number>(),
        weeklyById: new Map([[1, { achieved: 2 }]]),
      }),
    ).toBeNull();
  });

  it("waits until log pending is finished before playing celebration", () => {
    expect(canPlayCelebration({ id: 1, level: "single" }, true)).toBe(false);
    expect(canPlayCelebration({ id: 1, level: "single" }, false)).toBe(true);
    expect(canPlayCelebration(null, false)).toBe(false);
  });
});
