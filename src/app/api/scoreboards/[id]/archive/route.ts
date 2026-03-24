import { getDb } from "@/db";
import { ScoreboardService } from "@/domain/scoreboard/services/scoreboard.service";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { scoreboardIdParamSchema } from "@/domain/scoreboard/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const POST = withErrorHandler(
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

    const params = scoreboardIdParamSchema.safeParse(await context.params);
    if (!params.success) {
      return apiError("VALIDATION_ERROR", params.error.flatten().fieldErrors);
    }

    const service = new ScoreboardService(
      new ScoreboardStorage(db),
      new WorkspaceStorage(db),
    );
    const scoreboard = await service.archiveScoreboard(
      params.data.id,
      session.userId,
    );

    return apiSuccess({
      id: scoreboard.id,
      status: scoreboard.status,
    });
  },
);
