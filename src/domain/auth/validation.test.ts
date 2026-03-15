import {
  adminCreateUserSchema,
  loginSchema,
  passwordChangeSchema,
  validateCustomId,
  validatePassword,
} from "@/domain/auth/validation";
import { describe, expect, it } from "vitest";

describe("Auth Validation", () => {
  describe("validateCustomId", () => {
    it("3자 미만은 거부한다", () => {
      expect(validateCustomId("ab")).toBe(false);
    });
    it("20자 초과는 거부한다", () => {
      expect(validateCustomId("a".repeat(21))).toBe(false);
    });
    it("특수문자는 거부한다", () => {
      expect(validateCustomId("user@123")).toBe(false);
    });
    it("공백은 거부한다", () => {
      expect(validateCustomId("user 123")).toBe(false);
    });
    it("유효한 ID는 통과한다", () => {
      expect(validateCustomId("john123")).toBe(true);
    });
  });

  describe("validatePassword", () => {
    it("8자 미만은 거부한다", () => {
      expect(validatePassword("short")).toBe(false);
    });
    it("금지 문자(') 포함 시 거부한다", () => {
      expect(validatePassword("pass'word")).toBe(false);
    });
    it('금지 문자(") 포함 시 거부한다', () => {
      expect(validatePassword('pass"word')).toBe(false);
    });
    it("금지 문자(`) 포함 시 거부한다", () => {
      expect(validatePassword("pass`word")).toBe(false);
    });
    it("금지 문자(;) 포함 시 거부한다", () => {
      expect(validatePassword("pass;word")).toBe(false);
    });
    it("금지 문자(\\) 포함 시 거부한다", () => {
      expect(validatePassword("pass\\word")).toBe(false);
    });
    it("허용된 특수문자는 통과한다", () => {
      expect(validatePassword("validPass1!")).toBe(true);
      expect(validatePassword("validPass1@")).toBe(true);
    });
  });

  describe("Zod Schemas", () => {
    describe("loginSchema", () => {
      it("유효한 로그인 요청은 성공한다", () => {
        const result = loginSchema.safeParse({
          customId: "john123",
          password: "password123",
        });
        expect(result.success).toBe(true);
      });
      it("부적절한 ID는 실패한다", () => {
        const result = loginSchema.safeParse({
          customId: "jo",
          password: "password123",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("passwordChangeSchema", () => {
      it("유효한 비밀번호 변경 요청은 성공한다", () => {
        const result = passwordChangeSchema.safeParse({
          currentPassword: "oldPassword",
          newPassword: "newSecurePass1!",
        });
        expect(result.success).toBe(true);
      });
      it("유효하지 않은 새 비밀번호는 실패한다", () => {
        const result = passwordChangeSchema.safeParse({
          currentPassword: "oldPassword",
          newPassword: "short",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("adminCreateUserSchema", () => {
      it("유효한 사용자 생성 요청은 성공한다", () => {
        const result = adminCreateUserSchema.safeParse({
          customId: "newuser",
          nickname: "New User",
          password: "newSecurePass1!",
        });
        expect(result.success).toBe(true);
      });
      it("비밀번호 누락 시 실패한다", () => {
        const result = adminCreateUserSchema.safeParse({
          customId: "newuser",
          nickname: "New User",
        });
        expect(result.success).toBe(false);
      });
      it("닉네임 누락 시 실패한다", () => {
        const result = adminCreateUserSchema.safeParse({
          customId: "newuser",
          nickname: "",
          password: "newSecurePass1!",
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
