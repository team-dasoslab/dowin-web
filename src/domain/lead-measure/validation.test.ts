import { describe, expect, it } from "vitest";
import {
  leadMeasureCreateSchema,
  leadMeasureStatusQuerySchema,
  leadMeasureUpdateSchema,
} from "@/domain/lead-measure/validation";

describe("LeadMeasure Validation", () => {
  it("유효한 생성 요청은 성공한다", () => {
    const result = leadMeasureCreateSchema.safeParse({
      name: "매일 물 2L 마시기",
      targetValue: 7,
      period: "DAILY",
    });

    expect(result.success).toBe(true);
  });

  it("목표 횟수가 1 미만이면 실패한다", () => {
    const result = leadMeasureCreateSchema.safeParse({
      name: "매일 물 2L 마시기",
      targetValue: 0,
      period: "DAILY",
    });

    expect(result.success).toBe(false);
  });

  it("부분 수정 요청은 성공한다", () => {
    const result = leadMeasureUpdateSchema.safeParse({
      name: "주 3회 운동",
    });

    expect(result.success).toBe(true);
  });

  it("수정 필드가 없으면 실패한다", () => {
    const result = leadMeasureUpdateSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("status 쿼리는 active/all만 허용한다", () => {
    expect(
      leadMeasureStatusQuerySchema.safeParse({ status: "active" }).success,
    ).toBe(true);
    expect(
      leadMeasureStatusQuerySchema.safeParse({ status: "all" }).success,
    ).toBe(true);
    expect(
      leadMeasureStatusQuerySchema.safeParse({ status: "archived" }).success,
    ).toBe(false);
  });
});
