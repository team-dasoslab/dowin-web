import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  workspaceParamsSchema,
  workspaceUpdateSchema,
} from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSession } from "@/lib/server/auth";
import { requireWorkspaceAdminInWorkspace } from "@/lib/server/authz";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const PUT = withErrorHandler(
  async (
    request: Request,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const storage = new WorkspaceStorage(db);
    const service = new WorkspaceService(storage);

    const session = await getSession(db);
    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const params = await context.params;
    const parsedParams = workspaceParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      return apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
    }

    await requireWorkspaceAdminInWorkspace(db, parsedParams.data.id, session.userId);

    const body = await request.json();
    const parsedBody = workspaceUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    const workspace = await service.updateWorkspaceName(
      parsedParams.data.id,
      parsedBody.data.name,
    );

    return apiSuccess(workspace);
  },
);
