import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceMemberParamsSchema } from "@/domain/workspace/validation";
import { apiError } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAdmin } from "@/lib/server/with-workspace-access";
import { NextResponse } from "next/server";

export const DELETE = withWorkspaceAdmin<{ workspaceId: string; memberId: string }>(
  async (_request, { context, db, env, params }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const parsed = workspaceMemberParamsSchema.safeParse(params);
    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const service = new WorkspaceService(new WorkspaceStorage(db));
    await service.removeMember(context, parsed.data.memberId);

    return new NextResponse(null, { status: 204 });
  },
);
