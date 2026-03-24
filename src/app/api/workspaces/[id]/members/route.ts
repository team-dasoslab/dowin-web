import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceParamsSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAdminInWorkspace } from "@/lib/server/authz";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = withErrorHandler(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const storage = new WorkspaceStorage(db);
    const service = new WorkspaceService(storage);
    const session = await getSessionWithRefresh(db);
    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const parsedParams = workspaceParamsSchema.safeParse({ id });
    if (!parsedParams.success) {
      return apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
    }

    const workspaceId = parsedParams.data.id;
    await requireWorkspaceAdminInWorkspace(db, workspaceId, session.userId);
    const members = await service.getMembers(workspaceId, session.userId);
    return apiSuccess(members);
  },
);
