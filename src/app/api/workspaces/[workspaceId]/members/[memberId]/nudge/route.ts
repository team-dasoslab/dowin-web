import { getDb } from "@/db";
import { NudgeService } from "@/domain/dashboard/services/nudge.service";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import { ProfileStorage } from "@/domain/profile/storage/profile.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSession } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const POST = withErrorHandler(
  async (
    request: Request,
    { params }: { params: Promise<{ workspaceId: string; memberId: string }> },
  ) => {
    const { workspaceId, memberId } = await params;
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSession(db);
    if (!session) {
      return await apiError("UNAUTHORIZED");
    }

    const targetUserId = parseInt(memberId, 10);
    if (isNaN(targetUserId)) {
      return await apiError("VALIDATION_ERROR", {
        message: "잘못된 요청입니다.",
      });
    }

    const profileStorage = new ProfileStorage(db);
    const notificationStorage = new NotificationStorage(db);
    const workspaceStorage = new WorkspaceStorage(db);
    const nudgeService = new NudgeService(
      profileStorage,
      notificationStorage,
      workspaceStorage,
    );

    await nudgeService.sendNudge(
      {
        workspaceUid: workspaceId,
        fromUserId: session.userId,
        toUserId: targetUserId,
      },
      env,
    );

    return apiSuccess(204);
  },
);
