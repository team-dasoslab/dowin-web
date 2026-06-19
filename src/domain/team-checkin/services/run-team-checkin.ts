import { getDb } from "@/db";
import { sendFcmMessages } from "@/domain/notification/services/fcm";
import { TeamCheckinService } from "@/domain/team-checkin/services/team-checkin.service";
import { TeamCheckinStorage } from "@/domain/team-checkin/storage/team-checkin.storage";
import { type TeamCheckinRunInput } from "@/domain/team-checkin/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";

export const runTeamCheckin = async (
  env: CloudflareEnv,
  input: TeamCheckinRunInput = { dryRun: false },
) => {
  const db = getDb(env.DB);
  let workspaceId = input.workspaceId;

  if (workspaceId && Number.isNaN(Number(workspaceId))) {
    const resolved = await new WorkspaceStorage(db).resolveIdByUid(workspaceId);
    workspaceId = resolved ? String(resolved) : workspaceId;
  }

  const service = new TeamCheckinService(
    new TeamCheckinStorage(db),
    async (messages) => {
      if (!env.FCM_PROJECT_ID || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
        return { success: 0, failed: messages.length, disabledTokens: [] };
      }

      return await sendFcmMessages(messages, {
        projectId: env.FCM_PROJECT_ID,
        clientEmail: env.FCM_CLIENT_EMAIL,
        privateKey: env.FCM_PRIVATE_KEY,
      });
    },
  );

  return await service.run({ ...input, workspaceId });
};
