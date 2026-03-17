import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceMemberParamsSchema } from "@/domain/workspace/validation";
import { apiError } from "@/lib/server/api-response";
import { getSession } from "@/lib/server/auth";
import { requireWorkspaceAdminInWorkspace } from "@/lib/server/authz";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export const DELETE = withErrorHandler(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string; memberId: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSession(db);

    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const parsed = workspaceMemberParamsSchema.safeParse(await params);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const workspaceId = parsed.data.id;
    const memberId = parsed.data.memberId;

    await requireWorkspaceAdminInWorkspace(db, workspaceId, session.userId);

    const service = new WorkspaceService(new WorkspaceStorage(db));
    await service.removeMember(workspaceId, session.userId, memberId);

    return new NextResponse(null, { status: 204 });
  },
);
