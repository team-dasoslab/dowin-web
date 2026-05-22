import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { AnalyticsService } from "@/domain/analytics/services/analytics.service";
import { analyticsExportQuerySchema } from "@/domain/analytics/validation";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { getActiveWorkspaceIdFromCookies } from "@/lib/server/active-workspace";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const GET = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session || !session.userId) {
    return await apiError("UNAUTHORIZED");
  }

  const searchParams = new URL(request.url).searchParams;
  const query = analyticsExportQuerySchema.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    leadMeasureIds: searchParams.get("leadMeasureIds") ?? undefined,
    view: searchParams.get("view") ?? undefined,
  });

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

  const service = new AnalyticsService(
    workspaceStorage,
    new ScoreboardStorage(db),
    new DailyLogStorage(db),
  );

  const result = await service.getExportData(context, {
    from: query.data.from,
    to: query.data.to,
    leadMeasureIds: query.data.leadMeasureIds,
  });

  return apiSuccess(result);
});
