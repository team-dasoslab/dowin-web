import { ScoreboardService } from "@/domain/scoreboard/services/scoreboard.service";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { scoreboardCreateSchema } from "@/domain/scoreboard/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAccess(
  async (_request, { context, db }) => {
    const service = new ScoreboardService(new ScoreboardStorage(db));
    const scoreboards = await service.getHistory(context);
    return apiSuccess(scoreboards);
  },
);

export const POST = withWorkspaceAccess(
  async (request, { context, db, env }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const body = await request.json();
    const parsed = scoreboardCreateSchema.safeParse(body);

    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const service = new ScoreboardService(new ScoreboardStorage(db));
    const scoreboard = await service.createScoreboard(context, parsed.data);

    return apiSuccess(scoreboard, 201);
  },
);
