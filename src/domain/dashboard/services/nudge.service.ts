import { ProfileStorage } from "@/domain/profile/storage/profile.storage";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { sendFcmMessages } from "@/domain/notification/services/fcm";
import { NotFoundError, ForbiddenError } from "@/lib/server/errors";
import en from "@/messages/en.json";
import ko from "@/messages/ko.json";

const messages = { ko, en } as const;
type Locale = keyof typeof messages;

export class NudgeService {
  constructor(
    private profileStorage: ProfileStorage,
    private notificationStorage: NotificationStorage,
    private workspaceStorage: WorkspaceStorage,
  ) {}

  async sendNudge(
    input: {
      workspaceUid: string;
      fromUserId: number;
      toUserId: number;
    },
    env: CloudflareEnv,
  ): Promise<void> {
    const internalWorkspaceId = await this.workspaceStorage.resolveIdByUid(
      input.workspaceUid,
    );
    if (!internalWorkspaceId) {
      throw new NotFoundError("NOT_FOUND");
    }

    const senderMembership = await this.workspaceStorage.findMembership(
      internalWorkspaceId,
      input.fromUserId,
    );
    if (!senderMembership) {
      throw new ForbiddenError("FORBIDDEN");
    }

    const targetMembership = await this.workspaceStorage.findMembership(
      internalWorkspaceId,
      input.toUserId,
    );
    if (!targetMembership) {
      throw new NotFoundError("NOT_FOUND");
    }

    const senderProfile = await this.profileStorage.findProfileByUserId(
      input.fromUserId,
    );
    const senderNickname = senderProfile?.nickname ?? "팀원";

    const targetProfile = await this.profileStorage.findProfileByUserId(
      input.toUserId,
    );
    const targetLocale = (targetProfile?.locale as Locale) ?? "ko";
    const t = messages[targetLocale] ?? messages.ko;

    const tokens = await this.notificationStorage.findActiveTokensByUserId(
      input.toUserId,
    );

    if (tokens.length === 0) {
      return;
    }

    if (!env.FCM_PROJECT_ID || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
      console.warn("FCM credentials are not configured, skipping nudge push");
      return;
    }

    const title = t.Notification.socialNudgeTitle;
    const body = t.Notification.socialNudgeBody.replace("{senderName}", senderNickname);

    const delivery = await sendFcmMessages(
      tokens.map((t) => ({
        token: t.token,
        title,
        body,
        pushType: "social_nudge",
        campaignId: "social_nudge_v1",
      })),
      {
        projectId: env.FCM_PROJECT_ID,
        clientEmail: env.FCM_CLIENT_EMAIL,
        privateKey: env.FCM_PRIVATE_KEY,
      },
    );

    if (delivery.disabledTokens.length > 0) {
      await this.notificationStorage.disableDevicePushTokens(
        delivery.disabledTokens,
      );
    }
  }
}
