import {
  normalizeWorkspaceTagName,
  workspaceInviteCreateSchema,
  workspaceInviteStatusUpdateSchema,
  workspaceJoinByInviteSchema,
  workspaceTagCreateSchema,
} from "@/domain/workspace/validation";
import { describe, expect, it } from "vitest";

describe("Workspace validation", () => {
  describe("workspaceJoinByInviteSchema", () => {
    it("유효한 초대코드를 허용한다", () => {
      const result = workspaceJoinByInviteSchema.safeParse({ code: "ABCD123456" });
      expect(result.success).toBe(true);
    });

    it("비어있는 초대코드는 거부한다", () => {
      const result = workspaceJoinByInviteSchema.safeParse({ code: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("workspaceInviteCreateSchema", () => {
    it("1 이상 maxUses를 허용한다", () => {
      const result = workspaceInviteCreateSchema.safeParse({ maxUses: 3 });
      expect(result.success).toBe(true);
    });

    it("0회 제한은 거부한다", () => {
      const result = workspaceInviteCreateSchema.safeParse({ maxUses: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe("workspaceInviteStatusUpdateSchema", () => {
    it("ACTIVE/INACTIVE를 허용한다", () => {
      expect(
        workspaceInviteStatusUpdateSchema.safeParse({ status: "ACTIVE" }).success,
      ).toBe(true);
      expect(
        workspaceInviteStatusUpdateSchema.safeParse({ status: "INACTIVE" }).success,
      ).toBe(true);
    });
  });

  describe("workspaceTagCreateSchema", () => {
    it("16자 이하 태그 이름을 허용한다", () => {
      const result = workspaceTagCreateSchema.safeParse({ name: "깊은 일" });
      expect(result.success).toBe(true);
    });

    it("17자 이상 태그 이름을 거부한다", () => {
      const result = workspaceTagCreateSchema.safeParse({
        name: "12345678901234567",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("normalizeWorkspaceTagName", () => {
    it("공백 축약과 소문자 변환을 적용한다", () => {
      expect(normalizeWorkspaceTagName(" Deep   Work ")).toBe("deep work");
    });
  });
});
