import { describe, expect, it } from "vitest";
import {
  dailyLogDateParamSchema,
  dailyLogUpsertSchema,
  monthlyLogsQuerySchema,
  weeklyLogsQuerySchema,
} from "@/domain/daily-log/validation";

describe("DailyLog Validation", () => {
  it("유효한 기록 저장 요청은 성공한다", () => {
    const result = dailyLogUpsertSchema.safeParse({ value: true });

    expect(result.success).toBe(true);
  });

  it("미선택 상태는 DELETE로만 처리하고 false payload는 거부한다", () => {
    const result = dailyLogUpsertSchema.safeParse({ value: false });

    expect(result.success).toBe(false);
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

  it("월간 조회 쿼리의 monthStart 형식이 잘못되면 실패한다", () => {
    expect(
      monthlyLogsQuerySchema.safeParse({ monthStart: "2026-03-01" }).success,
    ).toBe(true);
    expect(
      monthlyLogsQuerySchema.safeParse({ monthStart: "03-01-2026" }).success,
    ).toBe(false);
  });
});
