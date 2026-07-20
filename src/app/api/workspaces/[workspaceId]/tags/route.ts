import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  normalizeWorkspaceTagName,
  workspaceTagCreateSchema,
} from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAccess<{ workspaceId: string }>(
  async (_request, { context, db }) => {
    const service = new WorkspaceService(new WorkspaceStorage(db));
    const tags = await service.listTags(context);
    return apiSuccess(tags);
  },
);

export const POST = withWorkspaceAccess<{ workspaceId: string }>(
  async (request, { context, db, env }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const parsedBody = workspaceTagCreateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return await apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    const service = new WorkspaceService(new WorkspaceStorage(db));
    const tag = await service.createTag(context, {
      name: parsedBody.data.name.trim(),
      normalizedName: normalizeWorkspaceTagName(parsedBody.data.name),
    });

    return apiSuccess(tag, 201);
  },
);
