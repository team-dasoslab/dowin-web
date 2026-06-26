import { describe, expect, it } from "vitest";
import {
  teamCheckinAdjustmentProposalCreateSchema,
  teamCheckinResponseSchema,
  teamCheckinSettingsSchema,
} from "@/domain/team-checkin/validation";

describe("team-checkin validation", () => {
  it("settings limits are bounded", () => {
    expect(
      teamCheckinSettingsSchema.safeParse({
        enabled: true,
        includeAdminAsMember: false,
        triggerNoWeeklyLogEnabled: true,
        triggerSlowStartEnabled: true,
        sendHour: 16,
        dailyMemberLimit: 2,
        dailyWorkspaceLimit: 30,
      }).success,
    ).toBe(true);

    expect(
      teamCheckinSettingsSchema.safeParse({
        enabled: true,
        includeAdminAsMember: false,
        triggerNoWeeklyLogEnabled: true,
        triggerSlowStartEnabled: true,
        sendHour: 16,
        dailyMemberLimit: 0,
        dailyWorkspaceLimit: 30,
      }).success,
    ).toBe(false);

    expect(
      teamCheckinSettingsSchema.safeParse({
        enabled: true,
        includeAdminAsMember: false,
        triggerNoWeeklyLogEnabled: true,
        triggerSlowStartEnabled: true,
        sendHour: 24,
        dailyMemberLimit: 2,
        dailyWorkspaceLimit: 30,
      }).success,
    ).toBe(false);
  });

  it("response note is capped at 500 chars", () => {
    expect(
      teamCheckinResponseSchema.safeParse({
        responseType: "BLOCKED",
        note: "a".repeat(500),
      }).success,
    ).toBe(true);

    expect(
      teamCheckinResponseSchema.safeParse({
        responseType: "BLOCKED",
        note: "a".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("adjustment proposal payload is validated by action type", () => {
    expect(
      teamCheckinAdjustmentProposalCreateSchema.safeParse({
        sourceResponseId: "res_1",
        actionType: "CHANGE_TARGET_COUNT",
        payload: { newTargetValue: 3 },
      }).success,
    ).toBe(true);

    expect(
      teamCheckinAdjustmentProposalCreateSchema.safeParse({
        sourceResponseId: "res_1",
        actionType: "CHANGE_TARGET_COUNT",
        payload: { replacementName: "wrong" },
      }).success,
    ).toBe(false);

    expect(
      teamCheckinAdjustmentProposalCreateSchema.safeParse({
        sourceResponseId: "res_1",
        actionType: "REPLACE_ACTION_ITEM",
        payload: {
          replacementName: "새 액션",
          replacementPeriod: "MONTHLY",
          replacementTargetValue: 3,
          replacementTrackingMode: "BOOLEAN",
          replacementDailyTargetCount: 1,
        },
      }).success,
    ).toBe(false);
  });
});
