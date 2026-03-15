import { describe, expect, it } from "vitest";
import { profileUpdateSchema } from "@/domain/profile/validation";

describe("Profile Validation", () => {
  it("유효한 닉네임은 통과한다", () => {
    expect(profileUpdateSchema.safeParse({ nickname: "새 닉네임" }).success).toBe(
      true,
    );
  });

  it("2자 미만 닉네임은 실패한다", () => {
    expect(profileUpdateSchema.safeParse({ nickname: "가" }).success).toBe(false);
  });

  it("특수문자가 포함되면 실패한다", () => {
    expect(profileUpdateSchema.safeParse({ nickname: "admin!" }).success).toBe(
      false,
    );
  });
});
