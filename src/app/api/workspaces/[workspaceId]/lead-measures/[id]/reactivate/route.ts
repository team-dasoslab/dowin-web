import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { LeadMeasureService } from "@/domain/lead-measure/services/lead-measure.service";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { leadMeasureIdParamSchema } from "@/domain/lead-measure/validation";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const POST = withWorkspaceAccess<{ workspaceId: string, id: string }>(
  async (_request, { context, db, env, params }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const validatedParams = leadMeasureIdParamSchema.safeParse(params);
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    const service = new LeadMeasureService(
      new ScoreboardStorage(db),
      new LeadMeasureStorage(db),
      new DailyLogStorage(db),
    );

    const result = await service.reactivateLeadMeasure(
      context,
      validatedParams.data.id,
    );
    return apiSuccess(result);
  },
);
