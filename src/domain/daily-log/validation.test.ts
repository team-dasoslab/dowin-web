import { describe, expect, it } from "vitest";
import {
  dailyLogDateParamSchema,
  dailyLogUpsertSchema,
  weeklyLogsQuerySchema,
} from "@/domain/daily-log/validation";

describe("DailyLog Validation", () => {
  it("유효한 기록 저장 요청은 성공한다", () => {
    const result = dailyLogUpsertSchema.safeParse({ value: true });

    expect(result.success).toBe(true);
  });

  it("날짜 파라미터는 YYYY-MM-DD 형식이어야 한다", () => {
    expect(
      dailyLogDateParamSchema.safeParse({
        leadMeasureId: "1",
        date: "2026-03-15",
      }).success,
    ).toBe(true);

    expect(
      dailyLogDateParamSchema.safeParse({
        leadMeasureId: "1",
        date: "03-15-2026",
      }).success,
    ).toBe(false);
  });

  it("주간 조회 쿼리의 weekStart 형식이 잘못되면 실패한다", () => {
    expect(
      weeklyLogsQuerySchema.safeParse({ weekStart: "2026-03-09" }).success,
    ).toBe(true);
    expect(
      weeklyLogsQuerySchema.safeParse({ weekStart: "03-09-2026" }).success,
    ).toBe(false);
  });
});
