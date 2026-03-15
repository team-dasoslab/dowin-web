import { z } from "zod";

export const ID_REGEX = /^[a-zA-Z0-9]{3,20}$/;
/**
 * 비밀번호 유효성 규칙:
 * - 최소 8자 이상
 * - 허용 특수문자: ! @ # $ % ^ & * ( ) - _ = + [ ] { } | : < > ? , . / ~
 * - 금지 특수문자: ' " ` ; \
 */
export const PW_REGEX = /^[a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|:<>?,./~]{8,}$/;

export const loginSchema = z.object({
  customId: z
    .string()
    .regex(ID_REGEX, "아이디는 3~20자의 영문 대소문자 및 숫자여야 합니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요."),
  newPassword: z
    .string()
    .regex(
      PW_REGEX,
      "비밀번호는 8자 이상의 영문, 숫자, 허용된 특수문자 조합이어야 합니다.",
    ),
});

export const adminCreateUserSchema = z.object({
  customId: z
    .string()
    .regex(ID_REGEX, "아이디는 3~20자의 영문 대소문자 및 숫자여야 합니다."),
  nickname: z
    .string()
    .min(1, "닉네임을 입력해주세요.")
    .max(50, "닉네임은 50자 이하여야 합니다."),
  password: z
    .string()
    .regex(
      PW_REGEX,
      "비밀번호는 8자 이상의 영문, 숫자, 허용된 특수문자 조합이어야 합니다.",
    ),
});

export const validateCustomId = (id: string): boolean => ID_REGEX.test(id);
export const validatePassword = (pw: string): boolean => PW_REGEX.test(pw);
