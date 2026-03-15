import { getDb } from "@/db";
import { ScoreboardService } from "@/domain/scoreboard/services/scoreboard.service";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { scoreboardCreateSchema } from "@/domain/scoreboard/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSession } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const createService = (db: ReturnType<typeof getDb>) =>
  new ScoreboardService(
    new ScoreboardStorage(db),
    new WorkspaceStorage(db),
  );

export const GET = withErrorHandler(async () => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }

  const scoreboards = await createService(db).getHistory(session.userId);
  return apiSuccess(scoreboards);
});

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }

  const body = await request.json();
  const parsed = scoreboardCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const scoreboard = await createService(db).createScoreboard(
    session.userId,
    parsed.data,
  );

  return apiSuccess(scoreboard, 201);
});
