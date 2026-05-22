import { getDb } from "@/db";
import { DashboardService } from "@/domain/dashboard/services/dashboard.service";
import { dashboardTeamQuerySchema } from "@/domain/dashboard/validation";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { getActiveWorkspaceIdFromCookies } from "@/lib/server/active-workspace";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session || !session.userId) {
    return await apiError("UNAUTHORIZED");
  }

  const query = dashboardTeamQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  if (!query.success) {
    return await apiError("VALIDATION_ERROR", query.error.flatten().fieldErrors);
  }

  const workspaceStorage = new WorkspaceStorage(db);
  let activeWorkspaceId = await getActiveWorkspaceIdFromCookies();

  if (!activeWorkspaceId) {
    const defaultWorkspace = await workspaceStorage.findUserWorkspace(session.userId);
    if (!defaultWorkspace) {
      return await apiError("NOT_FOUND");
    }
    activeWorkspaceId = defaultWorkspace.id;
  }

  const context = await requireWorkspaceAccess(workspaceStorage, activeWorkspaceId, session.userId);

  const service = new DashboardService(
    workspaceStorage,
    new ScoreboardStorage(db),
    new DailyLogStorage(db),
  );
  const result = await service.getTeamDashboard(
    context,
    query.data.weekStart,
  );

  return apiSuccess(result);
});
