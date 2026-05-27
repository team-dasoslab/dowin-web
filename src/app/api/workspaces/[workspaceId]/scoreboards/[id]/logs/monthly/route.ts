import { getDb } from "@/db";
import { DailyLogService } from "@/domain/daily-log/services/daily-log.service";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import {
  monthlyLogsQuerySchema,
  scoreboardLogsParamSchema,
} from "@/domain/daily-log/validation";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = withErrorHandler(async (request: Request, { params }: { params: Promise<{ workspaceId: string, id: string }> }) => {
  const { workspaceId } = await params;
const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return await apiError("UNAUTHORIZED");
    }

    const routeParams = await params;
    const validatedParams = scoreboardLogsParamSchema.safeParse({
      scoreboardId: routeParams.id,
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
      new WorkspaceStorage(db),
      new ScoreboardStorage(db),
      new LeadMeasureStorage(db),
      new DailyLogStorage(db),
    );

    const result = await service.getMonthlyLogs(workspaceId, validatedParams.data.scoreboardId,
      session.userId,
      query.data.monthStart,
    );

    return apiSuccess(result);
  },
);
