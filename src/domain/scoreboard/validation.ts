import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const scoreboardCreateSchema = z.object({
  goalName: z.string().trim().min(1, "가중목은 필수입니다."),
  lagMeasure: z.string().trim().min(1, "후행지표는 필수입니다."),
  startDate: z.string().regex(datePattern, "시작일 형식이 올바르지 않습니다."),
  endDate: z
    .string()
    .regex(datePattern, "종료일 형식이 올바르지 않습니다.")
    .nullable()
    .optional(),
});

export const scoreboardUpdateSchema = z
  .object({
    goalName: z.string().trim().min(1, "가중목은 필수입니다.").optional(),
    lagMeasure: z.string().trim().min(1, "후행지표는 필수입니다.").optional(),
    startDate: z
      .string()
      .regex(datePattern, "시작일 형식이 올바르지 않습니다.")
      .optional(),
    endDate: z
      .string()
      .regex(datePattern, "종료일 형식이 올바르지 않습니다.")
      .nullable()
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 필드가 필요합니다.",
  });

export const scoreboardIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
