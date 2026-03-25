import { z } from "zod";

export const dashboardTeamQuerySchema = z.object({
  weekStart: z.string().date().optional(),
});

export const dashboardTeamMemoListQuerySchema = z.object({
  targetUserId: z.coerce.number().int().positive(),
});

export const dashboardTeamMemoCreateSchema = z.object({
  targetUserId: z.number().int().positive(),
  content: z
    .string()
    .trim()
    .min(1, "메모 내용을 입력해주세요.")
    .max(500, "메모는 500자 이하로 입력해주세요."),
});

export const dashboardTeamMemoResolveSchema = z.object({
  isResolved: z.boolean(),
});
