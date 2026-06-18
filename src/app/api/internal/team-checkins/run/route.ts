import { getDb } from "@/db";
import { sendFcmMessages } from "@/domain/notification/services/fcm";
import { TeamCheckinService } from "@/domain/team-checkin/services/team-checkin.service";
import { TeamCheckinStorage } from "@/domain/team-checkin/storage/team-checkin.storage";
import { teamCheckinRunSchema } from "@/domain/team-checkin/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const { env } = getCloudflareContext();

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = teamCheckinRunSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
      { status: 422 },
    );
  }

  const db = getDb(env.DB);
  let workspaceId = parsed.data.workspaceId;
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

  const result = await service.run({ ...parsed.data, workspaceId });

  return NextResponse.json(result);
}
