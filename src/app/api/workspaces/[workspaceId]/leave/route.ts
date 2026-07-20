import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";
import { NextResponse } from "next/server";

export const DELETE = withWorkspaceAccess<{ workspaceId: string }>(
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

    await service.leaveWorkspace(context);

    return new NextResponse(null, { status: 204 });
  },
);
