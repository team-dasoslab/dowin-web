import { AnalyticsService } from "@/domain/analytics/services/analytics.service";
import { analyticsExportQuerySchema } from "@/domain/analytics/validation";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAccess(
  async (request, { context, db, workspaceStorage }) => {
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
  }
);
