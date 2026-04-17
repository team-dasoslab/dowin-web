import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  normalizeWorkspaceTagName,
  workspaceParamsSchema,
  workspaceTagCreateSchema,
} from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceMember } from "@/lib/server/authz";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = withErrorHandler(
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const service = new WorkspaceService(new WorkspaceStorage(db));
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return await apiError("UNAUTHORIZED");
    }

    const parsedParams = workspaceParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return await apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
    }

    await requireWorkspaceMember(db, parsedParams.data.id, session.userId);

    const tags = await service.listTags(parsedParams.data.id);
    return apiSuccess(tags);
  },
);

export const POST = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
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

    const parsedParams = workspaceParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return await apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
    }

    await requireWorkspaceMember(db, parsedParams.data.id, session.userId);

    const parsedBody = workspaceTagCreateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return await apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    const tag = await service.createTag(parsedParams.data.id, session.userId, {
      name: parsedBody.data.name.trim(),
      normalizedName: normalizeWorkspaceTagName(parsedBody.data.name),
    });

    return apiSuccess(tag, 201);
  },
);
