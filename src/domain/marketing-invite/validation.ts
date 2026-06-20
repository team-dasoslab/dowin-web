import { z } from "zod";

const inviteCodeSchema = z
  .string()
  .trim()
  .min(6, "초대코드는 6자 이상이어야 합니다.")
  .max(32, "초대코드는 32자 이하여야 합니다.")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "초대코드는 영문, 숫자, 하이픈, 밑줄만 사용할 수 있습니다.",
  );

const campaignNameSchema = z
  .string()
  .trim()
  .min(1, "캠페인명을 입력해주세요.")
  .max(100, "캠페인명은 100자 이하여야 합니다.");

const descriptionSchema = z
  .string()
  .trim()
  .max(500, "설명은 500자 이하여야 합니다.")
  .nullable()
  .optional();

const maxUsesSchema = z
  .number()
  .int("사용 가능 횟수는 정수여야 합니다.")
  .min(1, "사용 가능 횟수는 1 이상이어야 합니다.")
  .max(999, "사용 가능 횟수는 999 이하여야 합니다.");

const grantedSeatCountSchema = z
  .number()
  .int("좌석 수는 정수여야 합니다.")
  .min(1, "좌석 수는 1 이상이어야 합니다.")
  .max(10, "프로모션 코드는 최대 10명까지 제공할 수 있습니다.");

const expiresAtSchema = z.coerce.date().nullable().optional();

const entitlementDurationDaysSchema = z
  .number()
  .int("혜택 유지 일수는 정수여야 합니다.")
  .min(1, "혜택 유지 일수는 1 이상이어야 합니다.")
  .nullable()
  .optional();

export const marketingInviteCodeCreateSchema = z.object({
  code: inviteCodeSchema.optional(),
  campaignName: campaignNameSchema,
  description: descriptionSchema,
  maxUses: maxUsesSchema,
  grantedSeatCount: grantedSeatCountSchema,
  expiresAt: expiresAtSchema,
  entitlementDurationDays: entitlementDurationDaysSchema,
});

export const marketingInviteCodeUpdateSchema = z
  .object({
    campaignName: campaignNameSchema.optional(),
    description: descriptionSchema,
    maxUses: maxUsesSchema.optional(),
    grantedSeatCount: grantedSeatCountSchema.optional(),
    expiresAt: expiresAtSchema,
    entitlementDurationDays: entitlementDurationDaysSchema,
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 항목을 입력해주세요.",
  });

export const marketingInviteCodeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const marketingInviteRedemptionParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const marketingInviteRedemptionFeedbackUpdateSchema = z.object({
  feedbackStatus: z.enum(["NOT_REQUESTED", "REQUESTED", "RECEIVED", "DROPPED"]),
  operatorNote: z
    .string()
    .trim()
    .max(5000, "운영 메모는 5000자 이하여야 합니다.")
    .nullable()
    .optional(),
});

export const marketingInviteRedeemSchema = z.object({
  code: inviteCodeSchema,
  workspaceName: z
    .string()
    .trim()
    .min(1, "워크스페이스 이름을 입력해주세요.")
    .max(100, "워크스페이스 이름은 100자 이하여야 합니다."),
});

export const normalizeMarketingInviteCode = (code: string) =>
  code.trim().toUpperCase();

export const normalizeNullableText = (value: string | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};
