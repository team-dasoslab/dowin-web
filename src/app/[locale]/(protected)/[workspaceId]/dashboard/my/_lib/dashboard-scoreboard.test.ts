import {
  computeWeeklyRate,
  getNextLogValue,
  isEditableDailyLogDate,
  isDashboardView,
  updateWeeklyLogsCache,
  type WeeklyLogsQueryData,
} from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-scoreboard";
import { describe, expect, it } from "vitest";

describe("dashboard scoreboard", () => {
  it("toggles unchecked log to true", () => {
    expect(getNextLogValue(null)).toBe(true);
  });

  it("toggles checked log back to null", () => {
    expect(getNextLogValue(true)).toBeNull();
  });

  it("allows editing only for the current week", () => {
    expect(isEditableDailyLogDate("2026-04-06", "2026-04-09")).toBe(true);
    expect(isEditableDailyLogDate("2026-04-09", "2026-04-09")).toBe(true);
    expect(isEditableDailyLogDate("2026-04-05", "2026-04-09")).toBe(false);
  });

  it("recognizes supported dashboard views", () => {
    expect(isDashboardView("week")).toBe(true);
    expect(isDashboardView("month")).toBe(true);
    expect(isDashboardView("year")).toBe(false);
    expect(isDashboardView(null)).toBe(false);
  });

  it("computes weekly rate from non-monthly active measures", () => {
    expect(
      computeWeeklyRate(
        [
          { id: "1", period: "WEEKLY", targetValue: 3 },
          { id: 2, period: "DAILY", targetValue: 5 },
          { id: 3, period: "MONTHLY", targetValue: 10 },
        ],
        [
          { id: 1, achieved: 4 },
          { id: 2, achieved: 2 },
          { id: 3, achieved: 10 },
        ],
      ),
    ).toBe(63);
  });

  it("returns zero weekly rate when there is no target", () => {
    expect(computeWeeklyRate([{ id: 1, period: "WEEKLY", targetValue: 0 }], []))
      .toBe(0);
  });

  it("optimistically updates a weekly log cell and recalculates achievement", () => {
    const previous: WeeklyLogsQueryData = {
      status: 200 as const,
      data: {
        leadMeasures: [
          {
            id: 1,
            name: "운동",
            targetValue: 3,
            achieved: 1,
            achievementRate: 33.3,
            logs: {
              "2026-04-06": { value: true, count: 0, achieved: true },
            },
          },
          {
            id: 2,
            name: "독서",
            targetValue: 2,
            achieved: 0,
            achievementRate: 0,
            logs: {},
          },
        ],
      },
    };

    expect(
      updateWeeklyLogsCache(previous, 1, "2026-04-07", {
        value: true,
        count: 0,
        achieved: true,
      }),
    ).toEqual({
      status: 200,
      data: {
        leadMeasures: [
          {
            id: 1,
            name: "운동",
            targetValue: 3,
            achieved: 2,
            achievementRate: 66.7,
            logs: {
              "2026-04-06": { value: true, count: 0, achieved: true },
              "2026-04-07": { value: true, count: 0, achieved: true },
            },
          },
          {
            id: 2,
            name: "독서",
            targetValue: 2,
            achieved: 0,
            achievementRate: 0,
            logs: {},
          },
        ],
      },
    });
  });

  it("optimistically stores count cells using the achieved flag", () => {
    const previous = {
      status: 200 as const,
      data: {
        leadMeasures: [
          {
            id: 1,
            targetValue: 2,
            achieved: 0,
            achievementRate: 0,
            logs: {},
          },
        ],
      },
    };

    const next = updateWeeklyLogsCache(previous, 1, "2026-04-07", {
      value: true,
      count: 2,
      achieved: true,
    });

    expect(next?.data.leadMeasures?.[0]).toMatchObject({
      achieved: 1,
      achievementRate: 50,
      logs: {
        "2026-04-07": {
          value: true,
          count: 2,
          achieved: true,
        },
      },
    });
  });

  it("leaves non-success weekly cache data unchanged", () => {
    const previous = {
      status: 500 as const,
      data: { leadMeasures: [] },
    } as unknown as WeeklyLogsQueryData;

    expect(
      updateWeeklyLogsCache(previous, 1, "2026-04-07", {
        value: true,
        count: 0,
        achieved: true,
      }),
    ).toBe(previous);
    expect(
      updateWeeklyLogsCache(undefined, 1, "2026-04-07", {
        value: true,
        count: 0,
        achieved: true,
      }),
    ).toBe(
      undefined,
    );
  });
});
