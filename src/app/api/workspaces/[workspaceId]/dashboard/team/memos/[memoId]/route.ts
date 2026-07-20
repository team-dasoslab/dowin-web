import { TeamMemoService } from "@/domain/dashboard/services/team-memo.service";
import { TeamMemoStorage } from "@/domain/dashboard/storage/team-memo.storage";
import { apiError } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";
import { NextResponse } from "next/server";
import { z } from "zod";

const dashboardTeamMemoParamsSchema = z.object({
  workspaceId: z.string().min(1),
  memoId: z.string().min(1),
});

export const DELETE = withWorkspaceAccess<{ workspaceId: string; memoId: string }>(
  async (_request, { context, db, workspaceStorage, params }) => {
    const validatedParams = dashboardTeamMemoParamsSchema.safeParse(params);
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }
    const memoIdValue = Number(params.memoId);

    if (!Number.isInteger(memoIdValue) || memoIdValue <= 0) {
      return await apiError("VALIDATION_ERROR", {
        memoId: ["유효한 메모 ID를 입력해주세요."],
      });
    }

    const service = new TeamMemoService(workspaceStorage, new TeamMemoStorage(db));
    await service.deleteTeamMemo(context, memoIdValue);

    return new NextResponse(null, { status: 204 });
  },
);
