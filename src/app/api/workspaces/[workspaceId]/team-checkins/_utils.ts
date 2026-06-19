import { getDb } from "@/db";
import { TeamCheckinService } from "@/domain/team-checkin/services/team-checkin.service";
import { TeamCheckinStorage } from "@/domain/team-checkin/storage/team-checkin.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type NextResponse } from "next/server";

type TeamCheckinRouteContextResult =
  | { ok: false; error: NextResponse }
  | {
      ok: true;
      db: ReturnType<typeof getDb>;
      env: CloudflareEnv;
      context: Awaited<ReturnType<typeof requireWorkspaceAccess>>;
      service: TeamCheckinService;
    };

export async function getTeamCheckinRouteContext(
  workspaceUid: string,
): Promise<TeamCheckinRouteContextResult> {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return { ok: false, error: await apiError("UNAUTHORIZED") };
  }

  const workspaceStorage = new WorkspaceStorage(db);
  const workspaceId = await workspaceStorage.resolveIdByUid(workspaceUid);
  if (!workspaceId) {
    return { ok: false, error: await apiError("NOT_FOUND") };
  }

  const context = await requireWorkspaceAccess(
    workspaceStorage,
    workspaceId,
    session.userId,
  );

  return {
    ok: true,
    db,
    env,
    context,
    service: new TeamCheckinService(
      new TeamCheckinStorage(db),
    ),
  };
}
