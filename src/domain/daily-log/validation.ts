import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const dailyLogUpsertSchema = z.object({
  value: z.literal(true),
});

export const dailyLogDateParamSchema = z.object({
  leadMeasureId: z.coerce.number().int().positive(),
  date: z.string().regex(datePattern, "날짜 형식이 올바르지 않습니다."),
});

export const weeklyLogsQuerySchema = z.object({
  weekStart: z
    .string()
    .regex(datePattern, "날짜 형식이 올바르지 않습니다.")
    .optional(),
});

export const monthlyLogsQuerySchema = z.object({
  monthStart: z
    .string()
    .regex(datePattern, "날짜 형식이 올바르지 않습니다.")
    .optional(),
});

export const scoreboardLogsParamSchema = z.object({
  scoreboardId: z.coerce.number().int().positive(),
});
