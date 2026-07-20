import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  workspaceInviteParamsSchema,
  workspaceInviteStatusUpdateSchema,
} from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAdmin } from "@/lib/server/with-workspace-access";

export const PATCH = withWorkspaceAdmin<{ workspaceId: string; inviteId: string }>(
  async (request, { context, db, env, params }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const validatedParams = workspaceInviteParamsSchema.safeParse(params);
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    const body = await request.json();
    const parsedBody = workspaceInviteStatusUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return await apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    const service = new WorkspaceService(new WorkspaceStorage(db));
    const invite = await service.updateInviteStatus(
      context,
      validatedParams.data.inviteId,
      parsedBody.data.status,
    );

    return apiSuccess(invite);
  },
);
