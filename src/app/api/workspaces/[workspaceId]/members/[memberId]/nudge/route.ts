import { NudgeService } from "@/domain/dashboard/services/nudge.service";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import { ProfileStorage } from "@/domain/profile/storage/profile.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const POST = withWorkspaceAccess<{ workspaceId: string; memberId: string }>(
  async (_request, { context, db, env, params }) => {
    const targetUserId = parseInt(params.memberId, 10);
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
      context,
      {
        toUserId: targetUserId,
      },
      env,
    );

    return apiSuccess(204);
  },
);
