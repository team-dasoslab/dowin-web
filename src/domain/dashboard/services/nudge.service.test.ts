import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import { ProfileStorage } from "@/domain/profile/storage/profile.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { type WorkspaceAccessContext } from "@/lib/server/workspace-context";
import { beforeEach, describe, expect, it, Mocked, vi } from "vitest";
import { NudgeService } from "./nudge.service";

vi.mock("@/domain/notification/services/fcm", () => ({
  sendFcmMessages: vi.fn().mockResolvedValue({
    success: 1,
    failed: 0,
    disabledTokens: [],
  }),
}));

describe("NudgeService", () => {
  const ctx: WorkspaceAccessContext = {
    workspaceId: 1,
    workspacePublicId: "ws_abc",
    workspaceName: "My Workspace",
    userId: 100,
    role: "ADMIN",
    membershipId: 10,
    allowPastDailyLogEdit: false,
    entitlement: {
      canAccessBasicSubscription: true,
      entitlementSource: null,
      billingStatus: "ACTIVE",
      planCode: "BASIC",
    },
  };
  let profileStorage: Mocked<ProfileStorage>;
  let notificationStorage: Mocked<NotificationStorage>;
  let workspaceStorage: Mocked<WorkspaceStorage>;
  let service: NudgeService;
  const mockEnv = {
    FCM_PROJECT_ID: "mock-project",
    FCM_CLIENT_EMAIL: "mock-email",
    FCM_PRIVATE_KEY: "mock-key",
  } as never;

  beforeEach(() => {
    profileStorage = {
      findProfileByUserId: vi.fn(),
    } as unknown as Mocked<ProfileStorage>;

    notificationStorage = {
      findActiveTokensByUserId: vi.fn(),
      disableDevicePushTokens: vi.fn(),
    } as unknown as Mocked<NotificationStorage>;

    workspaceStorage = {
      resolveIdByUid: vi.fn(),
      findMembership: vi.fn(),
    } as unknown as Mocked<WorkspaceStorage>;

    service = new NudgeService(profileStorage, notificationStorage, workspaceStorage);
  });

  it("should send a nudge successfully", async () => {
    workspaceStorage.resolveIdByUid.mockResolvedValue(10);
    workspaceStorage.findMembership.mockResolvedValue({} as never);

    profileStorage.findProfileByUserId.mockResolvedValue({
      nickname: "홍길동",
    } as never);

    notificationStorage.findActiveTokensByUserId.mockResolvedValue([
      { token: "test-token" } as never,
    ]);

    await service.sendNudge({ ...ctx, userId: 1 }, { toUserId: 2 }, mockEnv);

    expect(profileStorage.findProfileByUserId).toHaveBeenCalledWith(1);
    expect(notificationStorage.findActiveTokensByUserId).toHaveBeenCalledWith(2);
  });

  it("should not send push if no active tokens are found", async () => {
    workspaceStorage.resolveIdByUid.mockResolvedValue(10);
    workspaceStorage.findMembership.mockResolvedValue({} as never);

    profileStorage.findProfileByUserId.mockResolvedValue({
      nickname: "홍길동",
    } as never);

    notificationStorage.findActiveTokensByUserId.mockResolvedValue([]);

    await service.sendNudge({ ...ctx, userId: 1 }, { toUserId: 2 }, mockEnv);

    expect(notificationStorage.findActiveTokensByUserId).toHaveBeenCalledWith(2);
  });
});
