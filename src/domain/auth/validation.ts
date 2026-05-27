import { z } from "zod";

export const ID_REGEX = /^[a-zA-Z0-9]{3,20}$/;
/**
 * 비밀번호 유효성 규칙:
 * - 최소 8자 이상
 * - 허용 특수문자: ! @ # $ % ^ & * ( ) - _ = + [ ] { } | : < > ? , . / ~
 * - 금지 특수문자: ' " ` ; \
 */
export const PW_REGEX = /^[a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|:<>?,./~]{8,}$/;
export const RECOVERY_CODE_REGEX = /^[A-HJ-NP-Z2-9]{10}$/;

export const loginSchema = z.object({
  customId: z
    .string()
    .regex(ID_REGEX, "아이디는 3~20자의 영문 대소문자 및 숫자여야 합니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const signupSchema = z.object({
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

export const signupCheckoutHeaderSchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(255),
});

export const signupCheckoutSchema = signupSchema.extend({
  workspaceName: z
    .string()
    .trim()
    .min(1, "워크스페이스 이름을 입력해주세요.")
    .max(100, "워크스페이스 이름은 100자 이하여야 합니다."),
  seatCount: z.coerce
    .number()
    .int("좌석 수는 정수여야 합니다.")
    .min(1, "좌석 수는 1 이상이어야 합니다.")
    .max(999, "좌석 수는 999 이하여야 합니다."),
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

const recoveryCodeFieldSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase().replaceAll("-", "").replaceAll(" ", ""))
  .refine(
    (value) => RECOVERY_CODE_REGEX.test(value),
    "복원코드 형식이 올바르지 않습니다.",
  );

export const recoveryCodeVerifySchema = z.object({
  recoveryCode: recoveryCodeFieldSchema,
});

export const passwordResetByRecoveryCodeSchema = z.object({
  recoveryCode: recoveryCodeFieldSchema,
  newPassword: z
    .string()
    .regex(
      PW_REGEX,
      "비밀번호는 8자 이상의 영문, 숫자, 허용된 특수문자 조합이어야 합니다.",
    ),
});

export const validateCustomId = (id: string): boolean => ID_REGEX.test(id);
export const validatePassword = (pw: string): boolean => PW_REGEX.test(pw);
