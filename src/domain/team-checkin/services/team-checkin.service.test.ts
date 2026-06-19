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
  entitlement: {
    canAccessBasicSubscription: true,
    entitlementSource: "POLAR",
    billingStatus: "ACTIVE",
    planCode: "BASIC",
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
      triggerSlowStartEnabled: true,
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

  it("does not send a weekly target 2 checkin on Monday before slow-start threshold", async () => {
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

  it("does not send a checkin until the lead measure is at least 7 days old", async () => {
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
            scoreboardId: 30,
            leadMeasureId: 20,
            leadMeasureName: "고객 인터뷰",
            leadMeasureCreatedAt: new Date("2026-06-12T01:00:00.000Z"),
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
        now: "2026-06-17T01:00:00.000Z",
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      evaluatedWorkspaceCount: 1,
      candidateCount: 0,
      createdDeliveryCount: 0,
    });
    expect(createDelivery).not.toHaveBeenCalled();
  });
});
