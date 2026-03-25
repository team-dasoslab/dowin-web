import {
  dashboardTeamMemoCreateSchema,
  dashboardTeamMemoListQuerySchema,
  dashboardTeamMemoResolveSchema,
} from "@/domain/dashboard/validation";
import { describe, expect, it } from "vitest";

describe("Dashboard validation", () => {
  describe("dashboardTeamMemoListQuerySchema", () => {
    it("유효한 대상 사용자 id를 허용한다", () => {
      const result = dashboardTeamMemoListQuerySchema.safeParse({
        targetUserId: "12",
      });

      expect(result.success).toBe(true);
      expect(result.success && result.data.targetUserId).toBe(12);
    });
  });

  describe("dashboardTeamMemoCreateSchema", () => {
    it("유효한 메모 생성 요청을 허용한다", () => {
      const result = dashboardTeamMemoCreateSchema.safeParse({
        targetUserId: 7,
        content: "  다음 주까지 정리하기  ",
      });

      expect(result.success).toBe(true);
      expect(result.success && result.data.content).toBe("다음 주까지 정리하기");
    });

    it("빈 내용은 거부한다", () => {
      const result = dashboardTeamMemoCreateSchema.safeParse({
        targetUserId: 7,
        content: "   ",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("dashboardTeamMemoResolveSchema", () => {
    it("완료 토글 payload를 허용한다", () => {
      const result = dashboardTeamMemoResolveSchema.safeParse({
        isResolved: true,
      });

      expect(result.success).toBe(true);
    });
  });
});
