import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  workspaceParamsSchema,
  workspaceUpdateSchema,
} from "@/domain/workspace/validation";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAdminInWorkspace } from "@/lib/server/authz";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export const PUT = withErrorHandler(
  async (
    request: Request,
    context: { params: Promise<{ workspaceId: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const storage = new WorkspaceStorage(db);
    const service = new WorkspaceService(storage);

    const session = await getSessionWithRefresh(db);
    if (!session) {
      return await apiError("UNAUTHORIZED");
    }

    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: session.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const params = await context.params;
    const validatedParams = workspaceParamsSchema.safeParse(params);

    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    const resolvedId = await storage.resolveIdByUid(validatedParams.data.workspaceId);
    if (!resolvedId) {
      return await apiError("NOT_FOUND", { detail: "워크스페이스를 찾을 수 없습니다." });
    }

    await requireWorkspaceAdminInWorkspace(db, resolvedId, session.userId);

    const body = await request.json();
    const parsedBody = workspaceUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return await apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    const workspace = await service.updateWorkspaceName(
      resolvedId,
      parsedBody.data.name,
    );

    return apiSuccess(workspace);
  },
);

export const DELETE = withErrorHandler(
  async (
    _request: Request,
    context: { params: Promise<{ workspaceId: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const storage = new WorkspaceStorage(db);
    const service = new WorkspaceService(storage);

    const session = await getSessionWithRefresh(db);
    if (!session) {
      return await apiError("UNAUTHORIZED");
    }

    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: session.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const params = await context.params;
    const validatedParams = workspaceParamsSchema.safeParse(params);

    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    const resolvedId = await storage.resolveIdByUid(validatedParams.data.workspaceId);
    if (!resolvedId) {
      return await apiError("NOT_FOUND", { detail: "워크스페이스를 찾을 수 없습니다." });
    }

    await requireWorkspaceAdminInWorkspace(db, resolvedId, session.userId);
    await service.deleteWorkspace(resolvedId);

    return new NextResponse(null, { status: 204 });
  },
);
