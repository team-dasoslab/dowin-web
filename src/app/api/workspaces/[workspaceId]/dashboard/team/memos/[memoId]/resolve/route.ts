import { TeamMemoService } from "@/domain/dashboard/services/team-memo.service";
import { TeamMemoStorage } from "@/domain/dashboard/storage/team-memo.storage";
import { dashboardTeamMemoResolveSchema } from "@/domain/dashboard/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const PATCH = withWorkspaceAccess<{ workspaceId: string; memoId: string }>(
  async (request, { context, db, workspaceStorage, params }) => {
    const memoIdValue = Number(params.memoId);
    const parsed = dashboardTeamMemoResolveSchema.safeParse(await request.json());

    if (!Number.isInteger(memoIdValue) || memoIdValue <= 0) {
      return await apiError("VALIDATION_ERROR", {
        memoId: ["유효한 메모 ID를 입력해주세요."],
      });
    }

    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const service = new TeamMemoService(workspaceStorage, new TeamMemoStorage(db));
    const result = await service.resolveTeamMemo(
      context,
      memoIdValue,
      parsed.data.isResolved,
    );

    return apiSuccess(result);
  },
);
