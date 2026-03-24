import { getDb } from "@/db";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { LeadMeasureService } from "@/domain/lead-measure/services/lead-measure.service";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import {
  leadMeasureIdParamSchema,
  leadMeasureUpdateSchema,
} from "@/domain/lead-measure/validation";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const createService = (db: ReturnType<typeof getDb>) =>
  new LeadMeasureService(
    new WorkspaceStorage(db),
    new ScoreboardStorage(db),
    new LeadMeasureStorage(db),
    new DailyLogStorage(db),
  );

export const PUT = withErrorHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: session.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const params = leadMeasureIdParamSchema.safeParse(await context.params);
    if (!params.success) {
      return apiError("VALIDATION_ERROR", params.error.flatten().fieldErrors);
    }

    const parsed = leadMeasureUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const measure = await createService(db).updateLeadMeasure(
      params.data.id,
      session.userId,
      parsed.data,
    );
    return apiSuccess(measure);
  },
);

export const DELETE = withErrorHandler(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: session.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const params = leadMeasureIdParamSchema.safeParse(await context.params);
    if (!params.success) {
      return apiError("VALIDATION_ERROR", params.error.flatten().fieldErrors);
    }

    const result = await createService(db).deleteLeadMeasure(
      params.data.id,
      session.userId,
    );
    return apiSuccess(result);
  },
);
