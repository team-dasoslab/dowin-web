import { ScoreboardService } from "@/domain/scoreboard/services/scoreboard.service";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAccess(
  async (_request, { context, db }) => {
    const service = new ScoreboardService(new ScoreboardStorage(db));
    const scoreboard = await service.getActiveScoreboard(context);
    return apiSuccess(scoreboard);
  },
);
