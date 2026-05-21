import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceCurrentUpdateSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { setActiveWorkspaceCookie } from "@/lib/server/active-workspace";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const PUT = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const storage = new WorkspaceStorage(db);
  const service = new WorkspaceService(storage);

  const session = await getSessionWithRefresh(db);
  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const body = await request.json();
  const parsed = workspaceCurrentUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const membership = await storage.findMembership(
    parsed.data.workspaceId,
    session.userId,
  );
  if (!membership) {
    return await apiError("FORBIDDEN");
  }

  await setActiveWorkspaceCookie(parsed.data.workspaceId);
  const workspaces = await service.listMyWorkspaces(
    session.userId,
    parsed.data.workspaceId,
  );
  const workspace = workspaces.find(
    (item) => item.id === parsed.data.workspaceId,
  );
  if (!workspace) {
    return await apiError("NOT_FOUND");
  }

  return apiSuccess(workspace);
});
