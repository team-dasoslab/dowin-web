import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceMemberParamsSchema } from "@/domain/workspace/validation";
import { apiError } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAdminInWorkspace } from "@/lib/server/authz";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export const DELETE = withErrorHandler(
  async (
    _request: Request,
    { params }: { params: Promise<{ workspaceId: string; memberId: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return await apiError("UNAUTHORIZED");
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

    const parsed = workspaceMemberParamsSchema.safeParse(await params);
    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const service = new WorkspaceService(new WorkspaceStorage(db));
    const resolvedId = await service.resolveWorkspaceIdByUid(parsed.data.workspaceId);
    if (!resolvedId) {
      return await apiError("NOT_FOUND", { detail: "워크스페이스를 찾을 수 없습니다." });
    }

    const memberId = parsed.data.memberId;

    await requireWorkspaceAdminInWorkspace(db, resolvedId, session.userId);

    await service.removeMember(resolvedId, session.userId, memberId);

    return new NextResponse(null, { status: 204 });
  },
);
