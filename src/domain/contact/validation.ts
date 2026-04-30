import { z } from "zod";

export const contactInquiryCreateSchema = z.object({
  category: z.enum(["GENERAL", "BILLING", "BUG_OR_ACCOUNT"]),
  replyEmail: z
    .string()
    .trim()
    .email("올바른 이메일 주소를 입력해주세요.")
    .max(320, "이메일 주소가 너무 깁니다."),
  subject: z
    .string()
    .trim()
    .min(1, "문의 제목을 입력해주세요.")
    .max(120, "문의 제목은 120자 이하로 입력해주세요."),
  message: z
    .string()
    .trim()
    .min(1, "문의 내용을 입력해주세요.")
    .max(5000, "문의 내용은 5000자 이하로 입력해주세요."),
  privacyConsent: z.boolean().refine((value) => value, {
    message: "문의 접수를 위해 개인정보 수집·이용 동의가 필요합니다.",
  }),
});

export const contactInquiryIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
