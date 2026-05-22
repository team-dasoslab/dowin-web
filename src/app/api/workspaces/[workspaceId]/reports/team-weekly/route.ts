import { getDb } from "@/db";
import { DashboardService } from "@/domain/dashboard/services/dashboard.service";
import { teamWeeklyReportQuerySchema } from "@/domain/dashboard/validation";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = withErrorHandler(
  async (request: Request, contextParams: { params: Promise<{ workspaceId: string }> }) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session || !session.userId) {
    return await apiError("UNAUTHORIZED");
  }

  const query = teamWeeklyReportQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  if (!query.success) {
    return await apiError("VALIDATION_ERROR", query.error.flatten().fieldErrors);
  }

  const workspaceStorage = new WorkspaceStorage(db);
  const params = await contextParams.params;
  const activeWorkspaceId = Number(params.workspaceId);

  if (!activeWorkspaceId || isNaN(activeWorkspaceId)) {
    return await apiError("VALIDATION_ERROR", { workspaceId: ["유효하지 않은 워크스페이스 ID입니다."] });
  }

  const context = await requireWorkspaceAccess(workspaceStorage, activeWorkspaceId, session.userId);

  if (context.role !== "ADMIN") {
    return await apiError("FORBIDDEN");
  }

  const service = new DashboardService(
    workspaceStorage,
    new ScoreboardStorage(db),
    new DailyLogStorage(db),
  );
  const result = await service.getTeamWeeklyReport(
    context,
    query.data.weekStart,
    query.data.weeks,
  );

  return apiSuccess(result);
});
