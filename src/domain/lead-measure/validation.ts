import { z } from "zod";

export const leadMeasureCreateSchema = z.object({
  name: z.string().trim().min(1, "선행지표 이름은 필수입니다."),
  targetValue: z.number().int().min(1, "목표 횟수는 1 이상이어야 합니다."),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
});

export const leadMeasureUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "선행지표 이름은 필수입니다.").optional(),
    targetValue: z
      .number()
      .int()
      .min(1, "목표 횟수는 1 이상이어야 합니다.")
      .optional(),
    period: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
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
