import { describe, expect, it } from "vitest";

import {
  WEEKLY_TARGET_MAX,
  clampMeasureTargetValue,
  createEmptyMeasure,
  getDaysInMonthFromIsoDate,
  getMeasureTargetMax,
  normalizeTagName,
} from "./measure";

describe("setup measure helpers", () => {
  describe("normalizeTagName", () => {
    it("trims, collapses whitespace, and lowercases tag names", () => {
      expect(normalizeTagName("  Deep   Work  ")).toBe("deep work");
    });
  });

  describe("getDaysInMonthFromIsoDate", () => {
    it("returns the correct day count for a regular month", () => {
      expect(getDaysInMonthFromIsoDate("2026-04-01")).toBe(30);
    });

    it("handles leap-year February", () => {
      expect(getDaysInMonthFromIsoDate("2024-02-15")).toBe(29);
    });

    it("falls back to 31 when the ISO month is invalid", () => {
      expect(getDaysInMonthFromIsoDate("2026-13-01")).toBe(31);
      expect(getDaysInMonthFromIsoDate("not-a-date")).toBe(31);
    });
  });

  describe("target limits", () => {
    it("uses the weekly target max for weekly measures", () => {
      expect(getMeasureTargetMax("WEEKLY", 31)).toBe(WEEKLY_TARGET_MAX);
    });

    it("uses the current month max for monthly measures", () => {
      expect(getMeasureTargetMax("MONTHLY", 30)).toBe(30);
    });

    it("clamps weekly target values between 1 and 7", () => {
      expect(clampMeasureTargetValue(0, "WEEKLY", 31)).toBe(1);
      expect(clampMeasureTargetValue(8, "WEEKLY", 31)).toBe(7);
      expect(clampMeasureTargetValue(4, "WEEKLY", 31)).toBe(4);
    });

    it("clamps monthly target values to the supplied month length", () => {
      expect(clampMeasureTargetValue(0, "MONTHLY", 28)).toBe(1);
      expect(clampMeasureTargetValue(31, "MONTHLY", 28)).toBe(28);
      expect(clampMeasureTargetValue(12, "MONTHLY", 28)).toBe(12);
    });
  });

  it("creates a weekly active boolean measure by default", () => {
    const measure = createEmptyMeasure();

    expect(measure).toMatchObject({
      existingId: null,
      initialStatus: null,
      status: "ACTIVE",
      name: "",
      period: "WEEKLY",
      targetValue: 3,
      trackingMode: "BOOLEAN",
      dailyTargetCount: 1,
      tags: [],
    });
    expect(measure.id).toEqual(expect.any(String));
    expect(measure.id.length).toBeGreaterThan(0);
  });
});
