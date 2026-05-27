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
import { z } from "zod";

const dashboardTeamMemoParamsSchema = z.object({
  workspaceId: z.string().min(1),
  memoId: z.string().min(1),
});

export const DELETE = withErrorHandler(
  async (_request: Request, contextParams: { params: Promise<{ workspaceId: string; memoId: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return await apiError("UNAUTHORIZED");
    }

    const { workspaceId, memoId } = await contextParams.params;
    const validatedParams = dashboardTeamMemoParamsSchema.safeParse({ workspaceId, memoId });
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }
    const memoIdValue = Number(memoId);
    const workspaceStorage = new WorkspaceStorage(db);
    const activeWorkspaceId = await workspaceStorage.resolveIdByUid(workspaceId);

    if (!activeWorkspaceId) {
      return await apiError("NOT_FOUND", { detail: "워크스페이스를 찾을 수 없습니다." });
    }

    if (!Number.isInteger(memoIdValue) || memoIdValue <= 0) {
      return await apiError("VALIDATION_ERROR", {
        memoId: ["유효한 메모 ID를 입력해주세요."],
      });
    }

    const contextAccess = await requireWorkspaceAccess(workspaceStorage, activeWorkspaceId, session.userId);

    const service = new TeamMemoService(workspaceStorage, new TeamMemoStorage(db));
    await service.deleteTeamMemo(contextAccess, memoIdValue);

    return new NextResponse(null, { status: 204 });
  },
);
