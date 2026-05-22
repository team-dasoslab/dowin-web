import { getDb } from "@/db";
import { TeamMemoService } from "@/domain/dashboard/services/team-memo.service";
import { TeamMemoStorage } from "@/domain/dashboard/storage/team-memo.storage";
import { dashboardTeamMemoResolveSchema } from "@/domain/dashboard/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const PATCH = withErrorHandler(
  async (
    request: Request,
    contextParams: { params: Promise<{ workspaceId: string; memoId: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return await apiError("UNAUTHORIZED");
    }

    const { workspaceId, memoId } = await contextParams.params;
    const memoIdValue = Number(memoId);
    const activeWorkspaceId = Number(workspaceId);
    const parsed = dashboardTeamMemoResolveSchema.safeParse(await request.json());

    if (!activeWorkspaceId || isNaN(activeWorkspaceId)) {
      return await apiError("VALIDATION_ERROR", { workspaceId: ["유효하지 않은 워크스페이스 ID입니다."] });
    }

    if (!Number.isInteger(memoIdValue) || memoIdValue <= 0) {
      return await apiError("VALIDATION_ERROR", {
        memoId: ["유효한 메모 ID를 입력해주세요."],
      });
    }

    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const workspaceStorage = new WorkspaceStorage(db);
    const contextAccess = await requireWorkspaceAccess(workspaceStorage, activeWorkspaceId, session.userId);

    const service = new TeamMemoService(workspaceStorage, new TeamMemoStorage(db));
    const result = await service.resolveTeamMemo(
      contextAccess,
      memoIdValue,
      parsed.data.isResolved,
    );

    return apiSuccess(result);
  },
);
