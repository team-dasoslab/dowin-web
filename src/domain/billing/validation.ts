import { z } from "zod";
import { entitlementSourceValues } from "@/domain/billing/types";

export const entitlementSourceSchema = z.enum(entitlementSourceValues);

export const workspaceBillingCheckoutHeaderSchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(255),
});

export const workspaceBillingCheckoutSchema = z.object({
  seatCount: z
    .number()
    .int("좌석 수는 정수여야 합니다.")
    .min(1, "좌석 수는 1 이상이어야 합니다.")
    .max(999, "좌석 수는 999 이하여야 합니다.")
    .optional(),
});

export const workspaceBillingSeatUpdateSchema = z.object({
  seatCount: z
    .number()
    .int("좌석 수는 정수여야 합니다.")
    .min(1, "좌석 수는 1 이상이어야 합니다.")
    .max(999, "좌석 수는 999 이하여야 합니다."),
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

export const adminBillingProviderProductUpsertSchema = z.object({
  provider: z.enum(["POLAR"]),
  environment: z.enum(["sandbox", "production"]),
  planCode: z.enum(["BASIC", "STANDARD"]),
  providerProductId: z
    .string()
    .trim()
    .min(1, "Provider product ID를 입력해주세요.")
    .max(255, "Provider product ID는 255자 이하여야 합니다."),
  isActive: z.boolean().optional(),
  changeReason: z
    .string()
    .trim()
    .min(1, "변경 사유를 입력해주세요.")
    .max(500, "변경 사유는 500자 이하여야 합니다."),
});

export const adminBillingManualOverrideSchema = z
  .object({
    planCode: z.enum(["BASIC", "FREE", "STANDARD"]),
    billingStatus: z.enum([
      "NONE",
      "ACTIVE",
      "CANCELED",
      "EXPIRED",
      "REVOKED",
    ]),
    entitlementSource: entitlementSourceSchema.nullable().optional(),
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
    purchasedSeatCount: z.coerce
      .number()
      .int("좌석 수는 정수여야 합니다.")
      .min(0, "좌석 수는 0 이상이어야 합니다.")
      .max(999, "좌석 수는 999 이하여야 합니다.")
      .nullable()
      .optional(),
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
      (["BASIC", "STANDARD"].includes(value.planCode) &&
        ["ACTIVE", "CANCELED"].includes(value.billingStatus));

    if (!validCombo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "플랜과 billing 상태 조합이 올바르지 않습니다. FREE는 NONE/EXPIRED/REVOKED만, BASIC/STANDARD는 ACTIVE/CANCELED만 허용됩니다.",
        path: ["billingStatus"],
      });
    }

    if (
      value.planCode === "FREE" &&
      value.entitlementSource &&
      value.entitlementSource !== "POLAR"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "FREE 상태에서는 POLAR entitlementSource만 유지할 수 있습니다.",
        path: ["entitlementSource"],
      });
    }
  });
