import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { AnalyticsService } from "@/domain/analytics/services/analytics.service";
import { analyticsExportQuerySchema } from "@/domain/analytics/validation";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const GET = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }

  const searchParams = new URL(request.url).searchParams;
  const query = analyticsExportQuerySchema.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    leadMeasureIds: searchParams.get("leadMeasureIds") ?? undefined,
    view: searchParams.get("view") ?? undefined,
  });

  if (!query.success) {
    return apiError("VALIDATION_ERROR", query.error.flatten().fieldErrors);
  }

  const service = new AnalyticsService(
    new WorkspaceStorage(db),
    new ScoreboardStorage(db),
    new DailyLogStorage(db),
  );

  const result = await service.getExportData(session.userId, {
    from: query.data.from,
    to: query.data.to,
    leadMeasureIds: query.data.leadMeasureIds,
  });

  return apiSuccess(result);
});
