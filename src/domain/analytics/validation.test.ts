import { describe, expect, it } from "vitest";
import { analyticsExportQuerySchema } from "@/domain/analytics/validation";

describe("Analytics Validation", () => {
  it("유효한 조회 쿼리는 성공한다", () => {
    const result = analyticsExportQuerySchema.safeParse({
      from: "2026-03-01",
      to: "2026-03-31",
      leadMeasureIds: "1,2,3",
      view: "month",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.leadMeasureIds).toEqual([1, 2, 3]);
    }
  });

  it("종료일이 시작일보다 빠르면 실패한다", () => {
    const result = analyticsExportQuerySchema.safeParse({
      from: "2026-03-31",
      to: "2026-03-01",
    });

    expect(result.success).toBe(false);
  });

  it("조회 기간이 92일을 초과하면 실패한다", () => {
    const result = analyticsExportQuerySchema.safeParse({
      from: "2026-01-01",
      to: "2026-04-03",
    });

    expect(result.success).toBe(false);
  });

  it("leadMeasureIds 형식이 숫자 csv가 아니면 실패한다", () => {
    const result = analyticsExportQuerySchema.safeParse({
      from: "2026-03-01",
      to: "2026-03-31",
      leadMeasureIds: "1,a,3",
    });

    expect(result.success).toBe(false);
  });
});
