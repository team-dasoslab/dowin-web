import { getDb } from "@/db";
import { TeamMemoService } from "@/domain/dashboard/services/team-memo.service";
import { TeamMemoStorage } from "@/domain/dashboard/storage/team-memo.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export const DELETE = withErrorHandler(
  async (_request: Request, contextParams: { params: Promise<{ id: string; memoId: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return await apiError("UNAUTHORIZED");
    }

    const { id: workspaceId, memoId } = await contextParams.params;
    const memoIdValue = Number(memoId);
    const activeWorkspaceId = Number(workspaceId);

    if (!activeWorkspaceId || isNaN(activeWorkspaceId)) {
      return await apiError("VALIDATION_ERROR", { workspaceId: ["유효하지 않은 워크스페이스 ID입니다."] });
    }

    if (!Number.isInteger(memoIdValue) || memoIdValue <= 0) {
      return await apiError("VALIDATION_ERROR", {
        memoId: ["유효한 메모 ID를 입력해주세요."],
      });
    }

    const workspaceStorage = new WorkspaceStorage(db);
    const contextAccess = await requireWorkspaceAccess(workspaceStorage, activeWorkspaceId, session.userId);

    const service = new TeamMemoService(workspaceStorage, new TeamMemoStorage(db));
    await service.deleteTeamMemo(contextAccess, memoIdValue);

    return new NextResponse(null, { status: 204 });
  },
);
