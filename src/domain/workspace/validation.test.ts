import {
  workspaceInviteCreateSchema,
  workspaceInviteStatusUpdateSchema,
  workspaceJoinByInviteSchema,
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
});
