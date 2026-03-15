import { describe, expect, it } from "vitest";
import {
  scoreboardCreateSchema,
  scoreboardUpdateSchema,
} from "@/domain/scoreboard/validation";

describe("Scoreboard Validation", () => {
  describe("scoreboardCreateSchema", () => {
    it("유효한 점수판 생성 요청은 성공한다", () => {
      const result = scoreboardCreateSchema.safeParse({
        goalName: "체중을 감량한다",
        lagMeasure: "80kg에서 75kg까지 달성",
        startDate: "2026-03-15",
        endDate: "2026-06-30",
      });

      expect(result.success).toBe(true);
    });

    it("goalName이 비어 있으면 실패한다", () => {
      const result = scoreboardCreateSchema.safeParse({
        goalName: "",
        lagMeasure: "80kg에서 75kg까지 달성",
        startDate: "2026-03-15",
      });

      expect(result.success).toBe(false);
    });

    it("startDate 형식이 잘못되면 실패한다", () => {
      const result = scoreboardCreateSchema.safeParse({
        goalName: "체중을 감량한다",
        lagMeasure: "80kg에서 75kg까지 달성",
        startDate: "03-15-2026",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("scoreboardUpdateSchema", () => {
    it("부분 수정 요청은 성공한다", () => {
      const result = scoreboardUpdateSchema.safeParse({
        goalName: "독서 습관을 만든다",
      });

      expect(result.success).toBe(true);
    });

    it("수정할 필드가 하나도 없으면 실패한다", () => {
      const result = scoreboardUpdateSchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });
});
