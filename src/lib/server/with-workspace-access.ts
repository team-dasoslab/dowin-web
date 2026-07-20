import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAccess, type WorkspaceAccessContext } from "@/lib/server/workspace-context";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { apiError } from "@/lib/server/api-response";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { assertWorkspaceOperationAllowed } from "@/domain/workspace/plan-limits";
import type { NextResponse, NextRequest } from "next/server";

export type WorkspaceRouteContext<TParams = { workspaceId: string }> = {
  context: WorkspaceAccessContext;
  db: ReturnType<typeof getDb>;
  env: ReturnType<typeof getCloudflareContext>["env"];
  params: TParams;
  workspaceStorage: WorkspaceStorage;
};

export type WorkspaceRouteHandler<TParams = { workspaceId: string }> = (
  req: NextRequest,
  ctx: WorkspaceRouteContext<TParams>
) => Promise<NextResponse | Response>;

export function withWorkspaceAccess<TParams extends { workspaceId: string } = { workspaceId: string }>(
  handler: WorkspaceRouteHandler<TParams>
) {
  return withErrorHandler(
    async (request: NextRequest, contextParams: { params: Promise<TParams> }) => {
      const { env } = getCloudflareContext();
      const db = getDb(env.DB);
      const session = await getSessionWithRefresh(db);

      if (!session || !session.userId) {
        return await apiError("UNAUTHORIZED");
      }

      const params = await contextParams.params;
      
      if (!params || !params.workspaceId) {
        return await apiError("VALIDATION_ERROR", { detail: "Workspace ID is required" });
      }

      const workspaceStorage = new WorkspaceStorage(db);
      const activeWorkspaceId = await workspaceStorage.resolveIdByUid(params.workspaceId);

      if (!activeWorkspaceId) {
        return await apiError("NOT_FOUND", { detail: "워크스페이스를 찾을 수 없습니다." });
      }

      const context = await requireWorkspaceAccess(
        workspaceStorage,
        activeWorkspaceId,
        session.userId,
      );

      // 도메인 서비스 내부의 중복 검사를 방지하기 위해 여기서 한 번만 검증합니다.
      await assertWorkspaceOperationAllowed(
        { id: context.workspaceId, planCode: context.entitlement.planCode },
        workspaceStorage
      );

      return handler(request, { context, db, env, params, workspaceStorage });
    }
  );
}
