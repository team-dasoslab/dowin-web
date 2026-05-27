import { getDb } from "@/db";
import { TeamMemoService } from "@/domain/dashboard/services/team-memo.service";
import { TeamMemoStorage } from "@/domain/dashboard/storage/team-memo.storage";
import {
  dashboardTeamMemoCreateSchema,
  dashboardTeamMemoListQuerySchema,
} from "@/domain/dashboard/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = withErrorHandler(
  async (request: Request, contextParams: { params: Promise<{ workspaceId: string }> }) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const query = dashboardTeamMemoListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  if (!query.success) {
    return await apiError("VALIDATION_ERROR", query.error.flatten().fieldErrors);
  }

  const workspaceStorage = new WorkspaceStorage(db);
  const params = await contextParams.params;
  const activeWorkspaceId = await workspaceStorage.resolveIdByUid(params.workspaceId);

  if (!activeWorkspaceId) {
    return await apiError("NOT_FOUND", { detail: "워크스페이스를 찾을 수 없습니다." });
  }

  const context = await requireWorkspaceAccess(workspaceStorage, activeWorkspaceId, session.userId);

  const service = new TeamMemoService(workspaceStorage, new TeamMemoStorage(db));
  const result = await service.listTeamMemos(
    context,
    query.data.targetUserId,
  );

  return apiSuccess(result);
});

export const POST = withErrorHandler(
  async (request: Request, contextParams: { params: Promise<{ workspaceId: string }> }) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const parsed = dashboardTeamMemoCreateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const workspaceStorage = new WorkspaceStorage(db);
  const params = await contextParams.params;
  const activeWorkspaceId = await workspaceStorage.resolveIdByUid(params.workspaceId);

  if (!activeWorkspaceId) {
    return await apiError("NOT_FOUND", { detail: "워크스페이스를 찾을 수 없습니다." });
  }

  const context = await requireWorkspaceAccess(workspaceStorage, activeWorkspaceId, session.userId);

  const service = new TeamMemoService(workspaceStorage, new TeamMemoStorage(db));
  const result = await service.createTeamMemo(context, parsed.data);

  return apiSuccess(result, 201);
});
