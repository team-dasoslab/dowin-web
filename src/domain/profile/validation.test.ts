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

  it("유효한 avatarKey는 통과한다", () => {
    expect(
      profileUpdateSchema.safeParse({ avatarKey: "smile.blue" }).success,
    ).toBe(true);
  });

  it("avatarKey를 null로 초기화할 수 있다", () => {
    expect(profileUpdateSchema.safeParse({ avatarKey: null }).success).toBe(true);
  });

  it("허용되지 않은 avatarKey는 실패한다", () => {
    expect(
      profileUpdateSchema.safeParse({ avatarKey: "bad.value" }).success,
    ).toBe(false);
  });

  it("변경할 필드가 없으면 실패한다", () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(false);
  });
});
