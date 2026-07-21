import { DailyLogService } from "@/domain/daily-log/services/daily-log.service";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import {
  monthlyLogsQuerySchema,
  scoreboardLogsParamSchema,
} from "@/domain/daily-log/validation";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAccess<{ workspaceId: string, id: string }>(
  async (request, { context, db, params }) => {
    const validatedParams = scoreboardLogsParamSchema.safeParse({
      scoreboardId: params.id,
    });
    const query = monthlyLogsQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    if (!validatedParams.success || !query.success) {
      return await apiError("VALIDATION_ERROR", {
        ...(validatedParams.success ? {} : validatedParams.error.flatten().fieldErrors),
        ...(query.success ? {} : query.error.flatten().fieldErrors),
      });
    }

    const service = new DailyLogService(
      new ScoreboardStorage(db),
      new LeadMeasureStorage(db),
      new DailyLogStorage(db),
    );

    const result = await service.getMonthlySummary(
      context,
      validatedParams.data.scoreboardId,
      query.data.monthStart,
    );

    return apiSuccess(result);
  },
);
