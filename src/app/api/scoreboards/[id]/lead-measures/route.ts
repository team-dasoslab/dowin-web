import { getDb } from "@/db";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { LeadMeasureService } from "@/domain/lead-measure/services/lead-measure.service";
import {
  leadMeasureCreateSchema,
  leadMeasureStatusQuerySchema,
  scoreboardIdParamSchema,
} from "@/domain/lead-measure/validation";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
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

export const GET = withErrorHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const routeParams = await context.params;
    const params = scoreboardIdParamSchema.safeParse({
      scoreboardId: routeParams.id,
    });
    const query = leadMeasureStatusQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    if (!params.success || !query.success) {
      return apiError("VALIDATION_ERROR", {
        ...(params.success ? {} : params.error.flatten().fieldErrors),
        ...(query.success ? {} : query.error.flatten().fieldErrors),
      });
    }

    const measures = await createService(db).getLeadMeasures(
      params.data.scoreboardId,
      session.userId,
      query.data.status,
    );

    return apiSuccess(measures);
  },
);

export const POST = withErrorHandler(
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

    const routeParams = await context.params;
    const params = scoreboardIdParamSchema.safeParse({
      scoreboardId: routeParams.id,
    });
    if (!params.success) {
      return apiError("VALIDATION_ERROR", params.error.flatten().fieldErrors);
    }

    const body = await request.json();
    const parsed = leadMeasureCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const measure = await createService(db).createLeadMeasure(
      params.data.scoreboardId,
      session.userId,
      parsed.data,
    );

    return apiSuccess(measure, 201);
  },
);
