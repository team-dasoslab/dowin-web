import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { LeadMeasureService } from "@/domain/lead-measure/services/lead-measure.service";
import {
  leadMeasureCreateSchema,
  leadMeasureStatusQuerySchema,
  scoreboardIdParamSchema,
} from "@/domain/lead-measure/validation";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAccess<{ workspaceId: string, id: string }>(
  async (request, { context, db, params }) => {
    const validatedParams = scoreboardIdParamSchema.safeParse({
      scoreboardId: params.id,
    });
    const query = leadMeasureStatusQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    if (!validatedParams.success || !query.success) {
      return await apiError("VALIDATION_ERROR", {
        ...(validatedParams.success ? {} : validatedParams.error.flatten().fieldErrors),
        ...(query.success ? {} : query.error.flatten().fieldErrors),
      });
    }

    const service = new LeadMeasureService(
      new ScoreboardStorage(db),
      new LeadMeasureStorage(db),
      new DailyLogStorage(db),
    );

    const measures = await service.getLeadMeasures(
      context,
      validatedParams.data.scoreboardId,
      query.data.status,
    );

    return apiSuccess(measures);
  },
);

export const POST = withWorkspaceAccess<{ workspaceId: string, id: string }>(
  async (request, { context, db, env, params }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const validatedParams = scoreboardIdParamSchema.safeParse({
      scoreboardId: params.id,
    });
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    const body = await request.json();
    const parsed = leadMeasureCreateSchema.safeParse(body);
    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const service = new LeadMeasureService(
      new ScoreboardStorage(db),
      new LeadMeasureStorage(db),
      new DailyLogStorage(db),
    );

    const measure = await service.createLeadMeasure(
      context,
      validatedParams.data.scoreboardId,
      parsed.data,
    );

    return apiSuccess(measure, 201);
  },
);
