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

export const adminContactInquiryListQuerySchema = z.object({
  status: z.enum(["RECEIVED", "IN_PROGRESS", "RESOLVED"]).optional(),
  category: z.enum(["GENERAL", "BILLING", "BUG_OR_ACCOUNT"]).optional(),
  userId: z.coerce.number().int().positive().optional(),
  workspaceId: z.coerce.number().int().positive().optional(),
});

export const adminContactInquiryUpdateSchema = z
  .object({
    status: z.enum(["RECEIVED", "IN_PROGRESS", "RESOLVED"]).optional(),
    answerSummary: z
      .string()
      .trim()
      .max(5000, "답변 요약은 5000자 이하로 입력해주세요.")
      .nullable()
      .optional(),
    changeReason: z
      .string()
      .trim()
      .min(1, "변경 사유를 입력해주세요.")
      .max(500, "변경 사유는 500자 이하로 입력해주세요."),
  })
  .refine(
    (value) => value.status !== undefined || value.answerSummary !== undefined,
    {
      message: "변경할 상태 또는 답변 요약을 하나 이상 입력해주세요.",
      path: ["status"],
    },
  )
  .refine(
    (value) =>
      value.status !== "RESOLVED" ||
      (value.answerSummary !== undefined &&
        value.answerSummary !== null &&
        value.answerSummary.trim().length > 0),
    {
      message: "해결 상태로 변경하려면 답변 요약이 필요합니다.",
      path: ["answerSummary"],
    },
  );
