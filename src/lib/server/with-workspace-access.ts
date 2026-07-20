import { getDb } from "@/db";
import { assertWorkspaceOperationAllowed } from "@/domain/workspace/plan-limits";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import {
  requireWorkspaceAccess,
  type WorkspaceAccessContext,
} from "@/lib/server/workspace-context";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NextRequest, NextResponse } from "next/server";

export type WorkspaceRouteContext<TParams = { workspaceId: string }> = {
  context: WorkspaceAccessContext;
  db: ReturnType<typeof getDb>;
  env: ReturnType<typeof getCloudflareContext>["env"];
  params: TParams;
  workspaceStorage: WorkspaceStorage;
};

export type WorkspaceRouteHandler<TParams = { workspaceId: string }> = (
  req: NextRequest,
  ctx: WorkspaceRouteContext<TParams>,
) => Promise<NextResponse | Response>;

export function withWorkspaceAccess<
  TParams extends { workspaceId: string } = { workspaceId: string },
>(handler: WorkspaceRouteHandler<TParams>) {
  return withErrorHandler<{ params: Promise<TParams> }>(async (request, contextParams) => {
    const { env, db } = contextParams;

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

    await assertWorkspaceOperationAllowed(
      { id: context.workspaceId, planCode: context.entitlement.planCode },
      workspaceStorage,
    );

    return handler(request, { context, db, env, params, workspaceStorage });
  });
}

export function withWorkspaceAdmin<
  TParams extends { workspaceId: string } = { workspaceId: string },
>(handler: WorkspaceRouteHandler<TParams>) {
  return withWorkspaceAccess<TParams>(async (req, ctx) => {
    if (ctx.context.role !== "ADMIN") {
      return await apiError("FORBIDDEN", { detail: "Workspace admin role required." });
    }
    return handler(req, ctx);
  });
}
