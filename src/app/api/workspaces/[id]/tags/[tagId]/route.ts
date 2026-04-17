import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  normalizeWorkspaceTagName,
  workspaceTagParamsSchema,
  workspaceTagUpdateSchema,
} from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceMember } from "@/lib/server/authz";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export const PUT = withErrorHandler(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string; tagId: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const service = new WorkspaceService(new WorkspaceStorage(db));
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

    const parsedParams = workspaceTagParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return await apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
    }

    await requireWorkspaceMember(db, parsedParams.data.id, session.userId);

    const parsedBody = workspaceTagUpdateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return await apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    const tag = await service.updateTag(parsedParams.data.id, parsedParams.data.tagId, {
      name: parsedBody.data.name.trim(),
      normalizedName: normalizeWorkspaceTagName(parsedBody.data.name),
    });

    return apiSuccess(tag);
  },
);

export const DELETE = withErrorHandler(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string; tagId: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const service = new WorkspaceService(new WorkspaceStorage(db));
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

    const parsedParams = workspaceTagParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return await apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
    }

    await requireWorkspaceMember(db, parsedParams.data.id, session.userId);
    await service.deleteTag(parsedParams.data.id, parsedParams.data.tagId);

    return new NextResponse(null, { status: 204 });
  },
);
