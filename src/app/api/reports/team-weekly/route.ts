import { getDb } from "@/db";
import { DashboardService } from "@/domain/dashboard/services/dashboard.service";
import { teamWeeklyReportQuerySchema } from "@/domain/dashboard/validation";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const query = teamWeeklyReportQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  if (!query.success) {
    return await apiError("VALIDATION_ERROR", query.error.flatten().fieldErrors);
  }

  const workspaceStorage = new WorkspaceStorage(db);
  const workspace = await workspaceStorage.findUserWorkspace(session.userId);

  if (!workspace) {
    return await apiError("NOT_FOUND");
  }

  const membership = await workspaceStorage.findMembership(
    workspace.id,
    session.userId,
  );

  if (membership?.role !== "ADMIN") {
    return await apiError("FORBIDDEN");
  }

  const service = new DashboardService(
    workspaceStorage,
    new ScoreboardStorage(db),
    new DailyLogStorage(db),
  );
  const result = await service.getTeamWeeklyReport(
    session.userId,
    query.data.weekStart,
    query.data.weeks,
  );

  return apiSuccess(result);
});
