import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceUpdateSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAdmin } from "@/lib/server/with-workspace-access";
import { NextResponse } from "next/server";

export const PUT = withWorkspaceAdmin<{ workspaceId: string }>(
  async (request, { context, db, env }) => {
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
    const parsedBody = workspaceUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return await apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    const storage = new WorkspaceStorage(db);
    const service = new WorkspaceService(storage);

    const workspace = await service.updateWorkspace(context, parsedBody.data);

    return apiSuccess(workspace);
  },
);

export const DELETE = withWorkspaceAdmin<{ workspaceId: string }>(
  async (_request, { context, db, env }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const storage = new WorkspaceStorage(db);
    const service = new WorkspaceService(storage);

    await service.deleteWorkspace(context);

    return new NextResponse(null, { status: 204 });
  },
);
