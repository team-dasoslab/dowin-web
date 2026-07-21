import { describe, expect, it, vi } from "vitest";
import { TeamCheckinService } from "@/domain/team-checkin/services/team-checkin.service";
import { TeamCheckinStorage } from "@/domain/team-checkin/storage/team-checkin.storage";
import { type WorkspaceAccessContext } from "@/lib/server/workspace-context";

const adminContext: WorkspaceAccessContext = {
  workspaceId: 1,
  workspacePublicId: "ws_uid",
  workspaceName: "Team",
  userId: 10,
  role: "ADMIN",
  membershipId: 100,
  allowPastDailyLogEdit: false,
  entitlement: {
    canAccessBasicSubscription: true,
    entitlementSource: "POLAR",
    billingStatus: "ACTIVE",
    planCode: "BASIC",
  },
  capacity: {
    hasAvailableMemberSlot: true,
    isOverLimit: false,
  },
};

const memberContext: WorkspaceAccessContext = {
  ...adminContext,
  userId: 11,
  role: "MEMBER",
};

const createStorage = (overrides: Partial<TeamCheckinStorage>) =>
  overrides as TeamCheckinStorage;

describe("TeamCheckinService", () => {
  it("blocks MEMBER from updating settings", async () => {
    const service = new TeamCheckinService(createStorage({}));

    await expect(
      service.updateSettings(memberContext, {
        enabled: true,
        includeAdminAsMember: false,
        triggerNoWeeklyLogEnabled: true,
        triggerSlowStartEnabled: true,
        sendHour: 16,
        dailyMemberLimit: 2,
        dailyWorkspaceLimit: 30,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("returns default disabled settings when no settings row exists", async () => {
    const service = new TeamCheckinService(
      createStorage({
        findSettings: vi.fn().mockResolvedValue(null),
      }),
    );

    await expect(service.getSettings(adminContext)).resolves.toEqual({
      enabled: false,
      includeAdminAsMember: false,
      triggerNoWeeklyLogEnabled: true,
      triggerSlowStartEnabled: false,
      sendHour: 16,
      dailyMemberLimit: 2,
      dailyWorkspaceLimit: 30,
    });
  });

  it("prevents duplicate checkin responses", async () => {
    const now = new Date("2026-06-18T01:00:00.000Z");
    const service = new TeamCheckinService(
      createStorage({
        findDeliveryByUid: vi.fn().mockResolvedValue({
          id: 1,
          uid: "chk_1",
          workspaceId: 1,
          memberUserId: 11,
          leadMeasureId: 20,
        }),
        findResponseByDeliveryId: vi.fn().mockResolvedValue({
          id: 2,
          uid: "res_1",
          deliveryId: 1,
          workspaceId: 1,
          memberUserId: 11,
          responseType: "SNOOZE_TODAY",
          note: null,
          createdAt: now,
        }),
      }),
    );

    await expect(
      service.respondToCheckin(memberContext, "chk_1", {
        responseType: "LOG_NOW",
      }),
    ).rejects.toThrow("TEAM_CHECKIN_ALREADY_RESPONDED");
  });

  it("does not send a weekly target 2 checkin on Monday before slow-start threshold when no-log trigger is disabled", async () => {
    const createDelivery = vi.fn();
    const service = new TeamCheckinService(
      createStorage({
        findEnabledSettingsWithWorkspaces: vi.fn().mockResolvedValue([
          {
            settings: {
              enabled: true,
              includeAdminAsMember: false,
              triggerNoWeeklyLogEnabled: false,
              triggerSlowStartEnabled: true,
              sendHour: 16,
              dailyMemberLimit: 2,
              dailyWorkspaceLimit: 30,
            },
            workspace: {
              id: 1,
            },
          },
        ]),
        findCandidates: vi.fn().mockResolvedValue([
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 11,
            memberRole: "MEMBER",
            userLocale: "ko",
            timezone: "Asia/Seoul",
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-01T01:00:00.000Z"),
            targetValue: 2,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
        ]),
        findLogsForCandidates: vi.fn().mockResolvedValue([]),
        findDeliveriesWithResponsesForWorkspaceOnDate: vi.fn().mockResolvedValue([]),
        createDelivery,
      }),
    );

    await expect(
      service.run({
        now: "2026-06-15T01:00:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 0,
      createdDeliveryCount: 0,
    });
    expect(createDelivery).not.toHaveBeenCalled();
  });

  it("creates localized no-weekly-log checkins when no-log trigger is enabled", async () => {
    const createDelivery = vi.fn().mockResolvedValue({
      id: 1,
      uid: "chk_1",
      deeplinkPath: "/ko/ws_uid/dashboard/my",
    });
    const service = new TeamCheckinService(
      createStorage({
        findEnabledSettingsWithWorkspaces: vi.fn().mockResolvedValue([
          {
            settings: {
              enabled: true,
              includeAdminAsMember: false,
              triggerNoWeeklyLogEnabled: true,
              triggerSlowStartEnabled: false,
              sendHour: 16,
              dailyMemberLimit: 2,
              dailyWorkspaceLimit: 30,
            },
            workspace: {
              id: 1,
            },
          },
        ]),
        findCandidates: vi.fn().mockResolvedValue([
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 11,
            memberRole: "MEMBER",
            userLocale: "ko",
            timezone: "Asia/Seoul",
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-19T00:00:00.000Z"),
            targetValue: 2,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 12,
            memberRole: "MEMBER",
            userLocale: "en",
            timezone: "Asia/Seoul",
            scoreboardId: 31,
            leadMeasureId: 21,
            leadMeasureName: "Customer interviews",
            leadMeasureCreatedAt: new Date("2026-06-19T00:00:00.000Z"),
            targetValue: 2,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
        ]),
        findLogsForCandidates: vi.fn().mockResolvedValue([]),
        findDeliveriesWithResponsesForWorkspaceOnDate: vi.fn().mockResolvedValue([]),
        findActiveDeviceTokens: vi.fn().mockResolvedValue([]),
        markDeliverySkipped: vi.fn(),
        createDelivery,
      }),
    );

    await expect(
      service.run({
        now: "2026-06-19T07:48:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 2,
      createdDeliveryCount: 2,
      skippedCount: 2,
    });
    expect(createDelivery).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        messageTitle: "Dowin",
        messageBody: "이번 주 고객 인터뷰 기록이 아직 없어요. 오늘 해볼까요?",
        reasonCode: "NO_WEEKLY_LOG",
      }),
    );
    expect(createDelivery).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        messageTitle: "Dowin",
        messageBody:
          "No log for Customer interviews this week. Give it a go today?",
        reasonCode: "NO_WEEKLY_LOG",
      }),
    );
  });

  it("waits until Thursday for a weekly target 1 no-log checkin", async () => {
    const createDelivery = vi.fn();
    const service = new TeamCheckinService(
      createStorage({
        findEnabledSettingsWithWorkspaces: vi.fn().mockResolvedValue([
          {
            settings: {
              enabled: true,
              includeAdminAsMember: false,
              triggerNoWeeklyLogEnabled: true,
              triggerSlowStartEnabled: false,
              sendHour: 16,
              dailyMemberLimit: 2,
              dailyWorkspaceLimit: 30,
            },
            workspace: {
              id: 1,
            },
          },
        ]),
        findCandidates: vi.fn().mockResolvedValue([
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 11,
            memberRole: "MEMBER",
            userLocale: "ko",
            timezone: "Asia/Seoul",
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-01T01:00:00.000Z"),
            targetValue: 1,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
        ]),
        findLogsForCandidates: vi.fn().mockResolvedValue([]),
        findDeliveriesWithResponsesForWorkspaceOnDate: vi.fn().mockResolvedValue([]),
        createDelivery,
      }),
    );

    await expect(
      service.run({
        now: "2026-06-17T07:00:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 0,
      createdDeliveryCount: 0,
    });
    expect(createDelivery).not.toHaveBeenCalled();
  });

  it("allows a weekly target 1 no-log checkin from Thursday", async () => {
    const createDelivery = vi.fn().mockResolvedValue({
      id: 1,
      uid: "chk_1",
      deeplinkPath: "/ko/ws_uid/dashboard/my",
    });
    const service = new TeamCheckinService(
      createStorage({
        findEnabledSettingsWithWorkspaces: vi.fn().mockResolvedValue([
          {
            settings: {
              enabled: true,
              includeAdminAsMember: false,
              triggerNoWeeklyLogEnabled: true,
              triggerSlowStartEnabled: false,
              sendHour: 16,
              dailyMemberLimit: 2,
              dailyWorkspaceLimit: 30,
            },
            workspace: {
              id: 1,
            },
          },
        ]),
        findCandidates: vi.fn().mockResolvedValue([
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 11,
            memberRole: "MEMBER",
            userLocale: "ko",
            timezone: "Asia/Seoul",
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-01T01:00:00.000Z"),
            targetValue: 1,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
        ]),
        findLogsForCandidates: vi.fn().mockResolvedValue([]),
        findDeliveriesWithResponsesForWorkspaceOnDate: vi.fn().mockResolvedValue([]),
        findActiveDeviceTokens: vi.fn().mockResolvedValue([]),
        markDeliverySkipped: vi.fn(),
        createDelivery,
      }),
    );

    await expect(
      service.run({
        now: "2026-06-18T07:00:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 1,
      createdDeliveryCount: 1,
    });
    expect(createDelivery).toHaveBeenCalledOnce();
  });

  it("allows a weekly target 3 no-log checkin from Wednesday", async () => {
    const createDelivery = vi.fn().mockResolvedValue({
      id: 1,
      uid: "chk_1",
      deeplinkPath: "/ko/ws_uid/dashboard/my",
    });
    const service = new TeamCheckinService(
      createStorage({
        findEnabledSettingsWithWorkspaces: vi.fn().mockResolvedValue([
          {
            settings: {
              enabled: true,
              includeAdminAsMember: false,
              triggerNoWeeklyLogEnabled: true,
              triggerSlowStartEnabled: false,
              sendHour: 16,
              dailyMemberLimit: 2,
              dailyWorkspaceLimit: 30,
            },
            workspace: {
              id: 1,
            },
          },
        ]),
        findCandidates: vi.fn().mockResolvedValue([
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 11,
            memberRole: "MEMBER",
            userLocale: "ko",
            timezone: "Asia/Seoul",
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-01T01:00:00.000Z"),
            targetValue: 3,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
        ]),
        findLogsForCandidates: vi.fn().mockResolvedValue([]),
        findDeliveriesWithResponsesForWorkspaceOnDate: vi.fn().mockResolvedValue([]),
        findActiveDeviceTokens: vi.fn().mockResolvedValue([]),
        markDeliverySkipped: vi.fn(),
        createDelivery,
      }),
    );

    await expect(
      service.run({
        now: "2026-06-17T07:00:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 1,
      createdDeliveryCount: 1,
    });
    expect(createDelivery).toHaveBeenCalledOnce();
  });

  it("does not create checkins outside the default 16:00 local send hour", async () => {
    const createDelivery = vi.fn();
    const service = new TeamCheckinService(
      createStorage({
        findEnabledSettingsWithWorkspaces: vi.fn().mockResolvedValue([
          {
            settings: {
              enabled: true,
              includeAdminAsMember: false,
              triggerNoWeeklyLogEnabled: true,
              triggerSlowStartEnabled: false,
              sendHour: 16,
              dailyMemberLimit: 2,
              dailyWorkspaceLimit: 30,
            },
            workspace: {
              id: 1,
            },
          },
        ]),
        findCandidates: vi.fn().mockResolvedValue([
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 11,
            memberRole: "MEMBER",
            userLocale: "ko",
            timezone: "Asia/Seoul",
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-01T01:00:00.000Z"),
            targetValue: 2,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
        ]),
        findLogsForCandidates: vi.fn().mockResolvedValue([]),
        findDeliveriesWithResponsesForWorkspaceOnDate: vi.fn().mockResolvedValue([]),
        createDelivery,
      }),
    );

    await expect(
      service.run({
        now: "2026-06-26T14:00:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 0,
      createdDeliveryCount: 0,
    });
    expect(createDelivery).not.toHaveBeenCalled();
  });

  it("creates checkins at the configured local send hour", async () => {
    const createDelivery = vi.fn().mockResolvedValue({
      id: 1,
      uid: "chk_1",
      deeplinkPath: "/ko/ws_uid/dashboard/my",
    });
    const service = new TeamCheckinService(
      createStorage({
        findEnabledSettingsWithWorkspaces: vi.fn().mockResolvedValue([
          {
            settings: {
              enabled: true,
              includeAdminAsMember: false,
              triggerNoWeeklyLogEnabled: true,
              triggerSlowStartEnabled: false,
              sendHour: 15,
              dailyMemberLimit: 2,
              dailyWorkspaceLimit: 30,
            },
            workspace: {
              id: 1,
            },
          },
        ]),
        findCandidates: vi.fn().mockResolvedValue([
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 11,
            memberRole: "MEMBER",
            userLocale: "ko",
            timezone: "Asia/Seoul",
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-01T01:00:00.000Z"),
            targetValue: 2,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
        ]),
        findLogsForCandidates: vi.fn().mockResolvedValue([]),
        findDeliveriesWithResponsesForWorkspaceOnDate: vi.fn().mockResolvedValue([]),
        findActiveDeviceTokens: vi.fn().mockResolvedValue([]),
        markDeliverySkipped: vi.fn(),
        createDelivery,
      }),
    );

    await expect(
      service.run({
        now: "2026-06-26T06:00:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 1,
      createdDeliveryCount: 1,
    });
    expect(createDelivery).toHaveBeenCalledOnce();
  });

  it("does not create slow-start checkins even when the stored setting is enabled", async () => {
    const createDelivery = vi.fn().mockResolvedValue({
      id: 1,
      uid: "chk_1",
      deeplinkPath: "/ko/ws_uid/dashboard/my",
    });
    const service = new TeamCheckinService(
      createStorage({
        findEnabledSettingsWithWorkspaces: vi.fn().mockResolvedValue([
          {
            settings: {
              enabled: true,
              includeAdminAsMember: false,
              triggerNoWeeklyLogEnabled: false,
              triggerSlowStartEnabled: true,
              sendHour: 16,
              dailyMemberLimit: 2,
              dailyWorkspaceLimit: 30,
            },
            workspace: {
              id: 1,
            },
          },
        ]),
        findCandidates: vi.fn().mockResolvedValue([
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 11,
            memberRole: "MEMBER",
            userLocale: "ko",
            timezone: "Asia/Seoul",
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-01T01:00:00.000Z"),
            targetValue: 2,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 12,
            memberRole: "MEMBER",
            userLocale: "en",
            timezone: "America/Los_Angeles",
            scoreboardId: 31,
            leadMeasureId: 21,
            leadMeasureName: "Customer interviews",
            leadMeasureCreatedAt: new Date("2026-06-01T01:00:00.000Z"),
            targetValue: 2,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
        ]),
        findLogsForCandidates: vi.fn().mockResolvedValue([]),
        findDeliveriesWithResponsesForWorkspaceOnDate: vi.fn().mockResolvedValue([]),
        findActiveDeviceTokens: vi.fn().mockResolvedValue([]),
        markDeliverySkipped: vi.fn(),
        createDelivery,
      }),
    );

    await expect(
      service.run({
        now: "2026-06-17T07:00:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 0,
      createdDeliveryCount: 0,
    });
    expect(createDelivery).not.toHaveBeenCalled();
  });

  it("evaluates a same-week lead measure while the week gate is disabled", async () => {
    const createDelivery = vi.fn();
    const service = new TeamCheckinService(
      createStorage({
        findEnabledSettingsWithWorkspaces: vi.fn().mockResolvedValue([
          {
            settings: {
              enabled: true,
              includeAdminAsMember: false,
              triggerNoWeeklyLogEnabled: true,
              triggerSlowStartEnabled: true,
              sendHour: 16,
              dailyMemberLimit: 2,
              dailyWorkspaceLimit: 30,
            },
            workspace: {
              id: 1,
            },
          },
        ]),
        findCandidates: vi.fn().mockResolvedValue([
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 11,
            memberRole: "MEMBER",
            userLocale: "ko",
            timezone: "Asia/Seoul",
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-16T01:00:00.000Z"),
            targetValue: 2,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
        ]),
        findLogsForCandidates: vi.fn().mockResolvedValue([]),
        findDeliveriesWithResponsesForWorkspaceOnDate: vi.fn().mockResolvedValue([]),
        createDelivery,
      }),
      undefined,
      { leadMeasureAgeGateEnabled: false },
    );

    await expect(
      service.run({
        now: "2026-06-17T07:00:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 1,
      createdDeliveryCount: 0,
    });
    expect(createDelivery).toHaveBeenCalledOnce();
  });

  it("skips a lead measure created in the current local week", async () => {
    const createDelivery = vi.fn();
    const service = new TeamCheckinService(
      createStorage({
        findEnabledSettingsWithWorkspaces: vi.fn().mockResolvedValue([
          {
            settings: {
              enabled: true,
              includeAdminAsMember: false,
              triggerNoWeeklyLogEnabled: true,
              triggerSlowStartEnabled: true,
              sendHour: 16,
              dailyMemberLimit: 2,
              dailyWorkspaceLimit: 30,
            },
            workspace: {
              id: 1,
            },
          },
        ]),
        findCandidates: vi.fn().mockResolvedValue([
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 11,
            memberRole: "MEMBER",
            userLocale: "ko",
            timezone: "Asia/Seoul",
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-16T01:00:00.000Z"),
            targetValue: 2,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
        ]),
        findLogsForCandidates: vi.fn().mockResolvedValue([]),
        findDeliveriesWithResponsesForWorkspaceOnDate: vi.fn().mockResolvedValue([]),
        createDelivery,
      }),
      undefined,
      { leadMeasureAgeGateEnabled: true },
    );

    await expect(
      service.run({
        now: "2026-06-17T07:00:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 0,
      createdDeliveryCount: 0,
    });
    expect(createDelivery).not.toHaveBeenCalled();
  });

  it("evaluates a Saturday-created lead measure from the next local week", async () => {
    const createDelivery = vi.fn();
    const service = new TeamCheckinService(
      createStorage({
        findEnabledSettingsWithWorkspaces: vi.fn().mockResolvedValue([
          {
            settings: {
              enabled: true,
              includeAdminAsMember: false,
              triggerNoWeeklyLogEnabled: true,
              triggerSlowStartEnabled: true,
              sendHour: 16,
              dailyMemberLimit: 2,
              dailyWorkspaceLimit: 30,
            },
            workspace: {
              id: 1,
            },
          },
        ]),
        findCandidates: vi.fn().mockResolvedValue([
          {
            workspaceId: 1,
            workspaceUid: "ws_uid",
            memberUserId: 11,
            memberRole: "MEMBER",
            userLocale: "ko",
            timezone: "Asia/Seoul",
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-20T03:00:00.000Z"),
            targetValue: 2,
            period: "WEEKLY",
            trackingMode: "BOOLEAN",
            dailyTargetCount: 1,
          },
        ]),
        findLogsForCandidates: vi.fn().mockResolvedValue([]),
        findDeliveriesWithResponsesForWorkspaceOnDate: vi.fn().mockResolvedValue([]),
        createDelivery,
      }),
      undefined,
      { leadMeasureAgeGateEnabled: true },
    );

    await expect(
      service.run({
        now: "2026-06-24T07:00:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 1,
      createdDeliveryCount: 0,
    });
    expect(createDelivery).toHaveBeenCalledOnce();
  });
});
