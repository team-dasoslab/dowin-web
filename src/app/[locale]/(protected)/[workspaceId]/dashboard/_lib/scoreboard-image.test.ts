import { describe, expect, it } from "vitest";

import {
  getLeadMeasureProgress,
  getSafeImageFilename,
} from "./scoreboard-image";

describe("scoreboard-image", () => {
  describe("getSafeImageFilename", () => {
    it("should generate a safe filename with valid inputs", () => {
      const result = getSafeImageFilename({
        nickname: "Dowin User",
        weekStart: "2026-06-08",
      });
      expect(result).toBe("dowin-Dowin-User-2026-06-08-scoreboard.png");
    });

    it("should handle missing nickname and weekStart", () => {
      const result = getSafeImageFilename({});
      expect(result).toBe("dowin-User-date-scoreboard.png");
    });

    it("should replace invalid path characters", () => {
      const result = getSafeImageFilename({
        nickname: "User <:*?>|",
        weekStart: "2026-06-08",
      });
      expect(result).toBe("dowin-User--------2026-06-08-scoreboard.png");
    });
  });

  describe("getLeadMeasureProgress", () => {
    it("should calculate correct progress for valid data", () => {
      const result = getLeadMeasureProgress({
        achieved: 3,
        total: 5,
      });
      expect(result).toEqual({ achieved: 3, total: 5, rate: 60 });
    });

    it("should handle 0 total", () => {
      const result = getLeadMeasureProgress({
        achieved: 0,
        total: 0,
      });
      expect(result).toEqual({ achieved: 0, total: 0, rate: 0 });
    });

    it("should cap rate at 100% when achieved > total", () => {
      const result = getLeadMeasureProgress({
        achieved: 7,
        total: 5,
      });
      expect(result).toEqual({ achieved: 7, total: 5, rate: 100 });
    });

    it("should handle missing achieved and total fields", () => {
      const result = getLeadMeasureProgress({});
      expect(result).toEqual({ achieved: 0, total: 0, rate: 0 });
    });
  });
});
