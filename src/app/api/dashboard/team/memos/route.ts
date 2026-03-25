import { getDb } from "@/db";
import { TeamMemoService } from "@/domain/dashboard/services/team-memo.service";
import { TeamMemoStorage } from "@/domain/dashboard/storage/team-memo.storage";
import {
  dashboardTeamMemoCreateSchema,
  dashboardTeamMemoListQuerySchema,
} from "@/domain/dashboard/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const createService = (db: ReturnType<typeof getDb>) =>
  new TeamMemoService(new WorkspaceStorage(db), new TeamMemoStorage(db));

export const GET = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }

  const query = dashboardTeamMemoListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  if (!query.success) {
    return apiError("VALIDATION_ERROR", query.error.flatten().fieldErrors);
  }

  const result = await createService(db).listTeamMemos(
    session.userId,
    query.data.targetUserId,
  );

  return apiSuccess(result);
});

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }

  const parsed = dashboardTeamMemoCreateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const result = await createService(db).createTeamMemo(session.userId, parsed.data);

  return apiSuccess(result, 201);
});
