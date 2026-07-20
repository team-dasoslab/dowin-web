import { TeamMemoService } from "@/domain/dashboard/services/team-memo.service";
import { TeamMemoStorage } from "@/domain/dashboard/storage/team-memo.storage";
import {
  dashboardTeamMemoCreateSchema,
  dashboardTeamMemoListQuerySchema,
} from "@/domain/dashboard/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAccess(
  async (request, { context, db, workspaceStorage }) => {
    const query = dashboardTeamMemoListQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    if (!query.success) {
      return await apiError("VALIDATION_ERROR", query.error.flatten().fieldErrors);
    }

    const service = new TeamMemoService(workspaceStorage, new TeamMemoStorage(db));
    const result = await service.listTeamMemos(
      context,
      query.data.targetUserId,
    );

    return apiSuccess(result);
  }
);

export const POST = withWorkspaceAccess(
  async (request, { context, db, workspaceStorage }) => {
    const parsed = dashboardTeamMemoCreateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const service = new TeamMemoService(workspaceStorage, new TeamMemoStorage(db));
    const result = await service.createTeamMemo(context, parsed.data);

    return apiSuccess(result, 201);
  }
);
