import { z } from "zod";

export const teamCheckinSettingsSchema = z.object({
  enabled: z.boolean(),
  includeAdminAsMember: z.boolean(),
  triggerNoWeeklyLogEnabled: z.boolean(),
  triggerSlowStartEnabled: z.boolean(),
  dailyMemberLimit: z.number().int().min(1).max(10),
  dailyWorkspaceLimit: z.number().int().min(1).max(500),
});

export const teamCheckinInboxQuerySchema = z.object({
  status: z.enum(["open", "all", "resolved"]).default("open"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const teamCheckinReportQuerySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const teamCheckinResponseSchema = z.object({
  responseType: z.enum([
    "LOG_NOW",
    "SNOOZE_TODAY",
    "BLOCKED",
    "ADJUSTMENT_REQUESTED",
  ]),
  note: z
    .string()
    .trim()
    .max(500, "메모는 500자 이내로 입력해주세요.")
    .nullable()
    .optional(),
});

export const changeTargetCountPayloadSchema = z.object({
  newTargetValue: z.number().int().min(1).max(7),
});

export const archiveActionItemPayloadSchema = z.object({
  reason: z.enum([
    "BLOCKED_BY_EXTERNAL_DEPENDENCY",
    "TOO_LARGE",
    "NOT_RELEVANT_THIS_WEEK",
    "OTHER",
  ]),
});

export const replaceActionItemPayloadSchema = z.object({
  replacementName: z.string().trim().min(1).max(120),
  replacementPeriod: z.literal("WEEKLY"),
  replacementTargetValue: z.number().int().min(1).max(7),
  replacementTrackingMode: z.enum(["BOOLEAN", "COUNT"]),
  replacementDailyTargetCount: z.number().int().min(1).max(20),
});

export const adjustmentPayloadSchema = z.discriminatedUnion("actionType", [
  z.object({
    actionType: z.literal("CHANGE_TARGET_COUNT"),
    payload: changeTargetCountPayloadSchema,
  }),
  z.object({
    actionType: z.literal("ARCHIVE_ACTION_ITEM"),
    payload: archiveActionItemPayloadSchema,
  }),
  z.object({
    actionType: z.literal("REPLACE_ACTION_ITEM"),
    payload: replaceActionItemPayloadSchema,
  }),
]);

export const teamCheckinAdjustmentProposalCreateSchema =
  adjustmentPayloadSchema.and(
    z.object({
      sourceResponseId: z.string().min(1),
      leaderNote: z
        .string()
        .trim()
        .max(500, "코멘트는 500자 이내로 입력해주세요.")
        .nullable()
        .optional(),
    }),
  );

export const teamCheckinAdjustmentDeclineSchema = z.object({
  reason: z.enum(["KEEP_CURRENT_GOAL", "NOT_NOW", "OTHER"]).optional(),
});

export const teamCheckinRunSchema = z.object({
  workspaceId: z.string().optional(),
  dryRun: z.boolean().default(false),
  now: z.string().datetime().optional(),
});

export type TeamCheckinSettingsInput = z.infer<
  typeof teamCheckinSettingsSchema
>;
export type TeamCheckinResponseInput = z.infer<
  typeof teamCheckinResponseSchema
>;
export type TeamCheckinAdjustmentProposalCreateInput = z.infer<
  typeof teamCheckinAdjustmentProposalCreateSchema
>;
export type TeamCheckinRunInput = z.infer<typeof teamCheckinRunSchema>;
