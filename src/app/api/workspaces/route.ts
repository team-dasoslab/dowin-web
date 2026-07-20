import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
export const GET = withErrorHandler(async (_, { db }) => {
  const storage = new WorkspaceStorage(db);
  const service = new WorkspaceService(storage);

  const session = await getSessionWithRefresh(db);
  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const workspaces = await service.listMyWorkspaces(session.userId);

  return apiSuccess(workspaces);
});

export const POST = withErrorHandler(async (request: Request, { db }) => {
  const session = await getSessionWithRefresh(db);
  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  await request.json().catch(() => null);
  return apiError("WORKSPACE_PAYMENT_REQUIRED");
});
