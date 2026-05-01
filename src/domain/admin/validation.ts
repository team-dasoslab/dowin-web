import { z } from "zod";

export const adminLoginSchema = z.object({
  loginId: z
    .string()
    .trim()
    .min(3, "운영자 로그인 ID를 입력해주세요.")
    .max(100, "운영자 로그인 ID는 100자 이하여야 합니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});
