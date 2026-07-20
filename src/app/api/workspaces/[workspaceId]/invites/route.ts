import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  workspaceInviteCreateSchema,
} from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAccess<{ workspaceId: string }>(
  async (_request, { context, db }) => {
    if (context.role !== "ADMIN") {
      return await apiError("FORBIDDEN", { detail: "Workspace admin role required." });
    }

    const service = new WorkspaceService(new WorkspaceStorage(db));
    const invites = await service.listInvites(context);
    return apiSuccess(invites);
  },
);

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
    const parsedBody = workspaceInviteCreateSchema.safeParse(body);

    if (!parsedBody.success) {
      return await apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    const service = new WorkspaceService(new WorkspaceStorage(db));
    const invite = await service.createInvite(
      context,
      parsedBody.data.maxUses,
    );

    return apiSuccess(invite, 201);
  },
);
