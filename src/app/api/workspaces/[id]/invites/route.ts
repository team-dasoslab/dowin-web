import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  workspaceInviteCreateSchema,
  workspaceParamsSchema,
} from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAdminInWorkspace } from "@/lib/server/authz";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = withErrorHandler(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const service = new WorkspaceService(new WorkspaceStorage(db));
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const parsedParams = workspaceParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
    }

    await requireWorkspaceAdminInWorkspace(db, parsedParams.data.id, session.userId);

    const invites = await service.listInvites(parsedParams.data.id);
    return apiSuccess(invites);
  },
);

export const POST = withErrorHandler(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const service = new WorkspaceService(new WorkspaceStorage(db));
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return apiError("UNAUTHORIZED");
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

    const parsedParams = workspaceParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
    }

    await requireWorkspaceAdminInWorkspace(db, parsedParams.data.id, session.userId);

    const body = await request.json();
    const parsedBody = workspaceInviteCreateSchema.safeParse(body);

    if (!parsedBody.success) {
      return apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    const invite = await service.createInvite(
      parsedParams.data.id,
      session.userId,
      parsedBody.data.maxUses,
    );

    return apiSuccess(invite, 201);
  },
);
