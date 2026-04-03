import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  workspaceParamsSchema,
  workspaceTransferAdminSchema,
} from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAdminInWorkspace } from "@/lib/server/authz";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const POST = withErrorHandler(
  async (
    request: Request,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const storage = new WorkspaceStorage(db);
    const service = new WorkspaceService(storage);

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

    const params = await context.params;
    const parsedParams = workspaceParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      return apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
    }

    await requireWorkspaceAdminInWorkspace(db, parsedParams.data.id, session.userId);

    const body = await request.json();
    const parsedBody = workspaceTransferAdminSchema.safeParse(body);

    if (!parsedBody.success) {
      return apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    await service.transferAdmin(
      parsedParams.data.id,
      session.userId,
      parsedBody.data.memberId,
    );

    return apiSuccess({ message: "관리자 권한을 이전했습니다." });
  },
);
