import { getDb } from "@/db";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { LeadMeasureService } from "@/domain/lead-measure/services/lead-measure.service";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { leadMeasureIdParamSchema } from "@/domain/lead-measure/validation";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSession } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const POST = withErrorHandler(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSession(db);

    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const params = leadMeasureIdParamSchema.safeParse(await context.params);
    if (!params.success) {
      return apiError("VALIDATION_ERROR", params.error.flatten().fieldErrors);
    }

    const service = new LeadMeasureService(
      new WorkspaceStorage(db),
      new ScoreboardStorage(db),
      new LeadMeasureStorage(db),
      new DailyLogStorage(db),
    );

    const result = await service.archiveLeadMeasure(params.data.id, session.userId);
    return apiSuccess(result);
  },
);
