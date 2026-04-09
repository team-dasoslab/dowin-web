import {
  getNextLogValue,
  isEditableDailyLogDate,
} from "@/app/(protected)/dashboard/my/_lib/dashboard-scoreboard";
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
});
