import { ScoreboardService } from "@/domain/scoreboard/services/scoreboard.service";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { scoreboardIdParamSchema } from "@/domain/scoreboard/validation";
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

    const validatedParams = scoreboardIdParamSchema.safeParse(params);
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    const service = new ScoreboardService(new ScoreboardStorage(db));
    const scoreboard = await service.reactivateScoreboard(context, validatedParams.data.id);

    return apiSuccess(scoreboard);
  },
);
