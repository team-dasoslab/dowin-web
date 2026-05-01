import { z } from "zod";

export const billingCheckoutHeaderSchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(255),
});

export const billingCheckoutBodySchema = z.object({
  locale: z.enum(["ko", "en"]),
});

export const adminBillingWorkspaceListQuerySchema = z.object({
  workspaceId: z.coerce.number().int().positive().optional(),
  workspaceName: z
    .string()
    .trim()
    .min(1, "워크스페이스 이름 검색어를 입력해주세요.")
    .max(100, "워크스페이스 이름 검색어는 100자 이하여야 합니다.")
    .optional(),
});

export const adminBillingWorkspaceParamsSchema = z.object({
  workspaceId: z.coerce.number().int().positive(),
});

export const adminBillingManualOverrideSchema = z
  .object({
    planCode: z.enum(["FREE", "STANDARD"]),
    billingStatus: z.enum([
      "NONE",
      "ACTIVE",
      "CANCELED",
      "EXPIRED",
      "REVOKED",
    ]),
    customerKey: z
      .string()
      .trim()
      .max(255, "고객 식별자는 255자 이하여야 합니다.")
      .nullable()
      .optional(),
    subscriptionKey: z
      .string()
      .trim()
      .max(255, "구독 식별자는 255자 이하여야 합니다.")
      .nullable()
      .optional(),
    currentPeriodEnd: z.string().datetime().nullable().optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    billingOwnerUserId: z.coerce.number().int().positive().nullable().optional(),
    changeReason: z
      .string()
      .trim()
      .min(1, "변경 사유를 입력해주세요.")
      .max(500, "변경 사유는 500자 이하여야 합니다."),
  })
  .superRefine((value, context) => {
    const validCombo =
      (value.planCode === "FREE" &&
        ["NONE", "EXPIRED", "REVOKED"].includes(value.billingStatus)) ||
      (value.planCode === "STANDARD" &&
        ["ACTIVE", "CANCELED"].includes(value.billingStatus));

    if (!validCombo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "플랜과 billing 상태 조합이 올바르지 않습니다. FREE는 NONE/EXPIRED/REVOKED만, STANDARD는 ACTIVE/CANCELED만 허용됩니다.",
        path: ["billingStatus"],
      });
    }
  });
