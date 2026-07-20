import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  workspaceTransferAdminSchema,
} from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const POST = withWorkspaceAccess<{ workspaceId: string }>(
  async (request, { context, db, env }) => {
    if (context.role !== "ADMIN") {
      return await apiError("FORBIDDEN", { detail: "Workspace admin role required." });
    }

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
    const parsedBody = workspaceTransferAdminSchema.safeParse(body);

    if (!parsedBody.success) {
      return await apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    const storage = new WorkspaceStorage(db);
    const service = new WorkspaceService(storage);

    await service.transferAdmin(
      context,
      parsedBody.data.memberId,
    );

    return apiSuccess({ message: "관리자 권한을 이전했습니다." });
  },
);
