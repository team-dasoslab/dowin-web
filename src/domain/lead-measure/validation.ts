import { z } from "zod";

const periodSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);
const trackingModeSchema = z.enum(["BOOLEAN", "COUNT"]);
const tagIdsSchema = z.array(z.number().int().positive()).max(3).optional();
const DAILY_TARGET_COUNT_MAX = 20;

const validateTargetValueByPeriod = (
  targetValue: number,
  period: "DAILY" | "WEEKLY" | "MONTHLY",
  addIssue: (message: string) => void,
) => {
  if (period === "WEEKLY" && targetValue > 7) {
    addIssue("주간 목표 횟수는 7회를 초과할 수 없습니다.");
    return;
  }

  if (period === "MONTHLY" && targetValue > 31) {
    addIssue("월간 목표 횟수는 31회를 초과할 수 없습니다.");
  }
};

export const leadMeasureCreateSchema = z
  .object({
    name: z.string().trim().min(1, "선행지표 이름은 필수입니다."),
    targetValue: z.number().int().min(1, "목표 횟수는 1 이상이어야 합니다."),
    period: periodSchema,
    trackingMode: trackingModeSchema.default("BOOLEAN"),
    orderIndex: z.number().int().min(0).default(0),
    dailyTargetCount: z
      .number()
      .int()
      .min(1, "하루 목표 횟수는 1 이상이어야 합니다.")
      .max(DAILY_TARGET_COUNT_MAX, `하루 목표 횟수는 ${DAILY_TARGET_COUNT_MAX}회를 초과할 수 없습니다.`)
      .default(1),
    tagIds: tagIdsSchema,
  })
  .superRefine((value, ctx) => {
    validateTargetValueByPeriod(value.targetValue, value.period, (message) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetValue"],
        message,
      });
    });

    if (value.tagIds && new Set(value.tagIds).size !== value.tagIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tagIds"],
        message: "태그는 중복 없이 선택해야 합니다.",
      });
    }
  });

export const leadMeasureUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "선행지표 이름은 필수입니다.").optional(),
    targetValue: z
      .number()
      .int()
      .min(1, "목표 횟수는 1 이상이어야 합니다.")
      .optional(),
    period: periodSchema.optional(),
    trackingMode: trackingModeSchema.optional(),
    orderIndex: z.number().int().min(0).optional(),
    dailyTargetCount: z
      .number()
      .int()
      .min(1, "하루 목표 횟수는 1 이상이어야 합니다.")
      .max(DAILY_TARGET_COUNT_MAX, `하루 목표 횟수는 ${DAILY_TARGET_COUNT_MAX}회를 초과할 수 없습니다.`)
      .optional(),
    tagIds: tagIdsSchema,
  })
  .superRefine((value, ctx) => {
    if (value.targetValue === undefined || value.period === undefined) {
      return;
    }

    validateTargetValueByPeriod(value.targetValue, value.period, (message) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetValue"],
        message,
      });
    });

    if (value.tagIds && new Set(value.tagIds).size !== value.tagIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tagIds"],
        message: "태그는 중복 없이 선택해야 합니다.",
      });
    }
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 필드가 필요합니다.",
  });

export const leadMeasureStatusQuerySchema = z.object({
  status: z.enum(["active", "all"]).default("active"),
});

export const scoreboardIdParamSchema = z.object({
  scoreboardId: z.coerce.number().int().positive(),
});

export const leadMeasureIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
