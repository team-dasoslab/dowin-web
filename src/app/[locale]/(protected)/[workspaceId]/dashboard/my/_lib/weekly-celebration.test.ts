import { describe, expect, it } from "vitest";

import {
  getCompletedWeeklyMeasureIds,
  getWeeklyCelebrationSnapshot,
} from "./weekly-celebration";

describe("weekly celebration helpers", () => {
  it("counts only completed non-monthly measures", () => {
    const snapshot = getWeeklyCelebrationSnapshot(
      [
        { id: 1, period: "WEEKLY", targetValue: 3 },
        { id: 2, period: "DAILY", targetValue: 5 },
        { id: 3, period: "MONTHLY", targetValue: 10 },
        { id: 4, period: "WEEKLY", targetValue: 0 },
      ],
      new Map([
        [1, { achieved: 3 }],
        [2, { achieved: 4 }],
        [3, { achieved: 10 }],
        [4, { achieved: 99 }],
      ]),
    );

    expect(snapshot).toEqual({
      completedCount: 1,
      totalCount: 3,
    });
  });

  it("treats missing achieved data as zero", () => {
    expect(
      getWeeklyCelebrationSnapshot(
        [{ id: 1, period: "WEEKLY", targetValue: 1 }],
        new Map(),
      ),
    ).toEqual({
      completedCount: 0,
      totalCount: 1,
    });
  });

  it("returns completed weekly measure ids and skips invalid ids", () => {
    const completedIds = getCompletedWeeklyMeasureIds(
      [
        { id: "1", period: "WEEKLY", targetValue: 3 },
        { id: "bad-id", period: "WEEKLY", targetValue: 1 },
        { id: 2, period: "MONTHLY", targetValue: 1 },
        { id: 3, period: "DAILY", targetValue: 2 },
      ],
      new Map([
        [1, { achieved: 3 }],
        [3, { achieved: 2 }],
      ]),
    );

    expect(completedIds).toEqual(new Set([1, 3]));
  });
});
