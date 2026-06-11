import { describe, expect, it, vi } from "vitest";

import {
  addDays,
  addMonths,
  formatUtcDate,
  getMonthCalendarWeeks,
  getMonthDates,
  getMonthStart,
  getTodayInKst,
  getWeekDates,
  isValidDateString,
} from "./week";

describe("dashboard week helpers", () => {
  it("formats UTC dates as yyyy-mm-dd", () => {
    expect(formatUtcDate(new Date(Date.UTC(2026, 3, 9, 23, 59)))).toBe(
      "2026-04-09",
    );
  });

  it("validates only real yyyy-mm-dd dates", () => {
    expect(isValidDateString("2026-04-09")).toBe(true);
    expect(isValidDateString("2026-02-29")).toBe(false);
    expect(isValidDateString("2026-4-9")).toBe(false);
    expect(isValidDateString(null)).toBe(false);
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("returns the first day of the selected month", () => {
    expect(getMonthStart("2026-04-29")).toBe("2026-04-01");
  });

  it("adds months while clamping to the target month length", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2026-03-30", -1)).toBe("2026-02-28");
  });

  it("lists every date in a month", () => {
    expect(getMonthDates("2026-02-15")).toEqual([
      "2026-02-01",
      "2026-02-02",
      "2026-02-03",
      "2026-02-04",
      "2026-02-05",
      "2026-02-06",
      "2026-02-07",
      "2026-02-08",
      "2026-02-09",
      "2026-02-10",
      "2026-02-11",
      "2026-02-12",
      "2026-02-13",
      "2026-02-14",
      "2026-02-15",
      "2026-02-16",
      "2026-02-17",
      "2026-02-18",
      "2026-02-19",
      "2026-02-20",
      "2026-02-21",
      "2026-02-22",
      "2026-02-23",
      "2026-02-24",
      "2026-02-25",
      "2026-02-26",
      "2026-02-27",
      "2026-02-28",
    ]);
  });

  it("builds Monday-first calendar weeks with null padding", () => {
    expect(getMonthCalendarWeeks("2026-02-01")).toEqual([
      [null, null, null, null, null, null, "2026-02-01"],
      [
        "2026-02-02",
        "2026-02-03",
        "2026-02-04",
        "2026-02-05",
        "2026-02-06",
        "2026-02-07",
        "2026-02-08",
      ],
      [
        "2026-02-09",
        "2026-02-10",
        "2026-02-11",
        "2026-02-12",
        "2026-02-13",
        "2026-02-14",
        "2026-02-15",
      ],
      [
        "2026-02-16",
        "2026-02-17",
        "2026-02-18",
        "2026-02-19",
        "2026-02-20",
        "2026-02-21",
        "2026-02-22",
      ],
      [
        "2026-02-23",
        "2026-02-24",
        "2026-02-25",
        "2026-02-26",
        "2026-02-27",
        "2026-02-28",
        null,
      ],
    ]);
  });

  it("returns Monday to Sunday dates for the anchor week", () => {
    expect(getWeekDates("2026-04-09")).toEqual([
      "2026-04-06",
      "2026-04-07",
      "2026-04-08",
      "2026-04-09",
      "2026-04-10",
      "2026-04-11",
      "2026-04-12",
    ]);

    expect(getWeekDates("2026-04-12")[0]).toBe("2026-04-06");
  });

  it("derives today from KST rather than the local UTC date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-09T16:30:00.000Z"));

    expect(getTodayInKst()).toBe("2026-04-10");

    vi.useRealTimers();
  });
});
