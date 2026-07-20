import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  normalizeWorkspaceTagName,
  workspaceTagParamsSchema,
  workspaceTagUpdateSchema,
} from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";
import { NextResponse } from "next/server";

export const PUT = withWorkspaceAccess<{ workspaceId: string; tagId: string }>(
  async (request, { context, db, env, params }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const validatedParams = workspaceTagParamsSchema.safeParse(params);
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    const parsedBody = workspaceTagUpdateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return await apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
    }

    const service = new WorkspaceService(new WorkspaceStorage(db));
    const tag = await service.updateTag(context, validatedParams.data.tagId, {
      name: parsedBody.data.name.trim(),
      normalizedName: normalizeWorkspaceTagName(parsedBody.data.name),
    });

    return apiSuccess(tag);
  },
);

export const DELETE = withWorkspaceAccess<{ workspaceId: string; tagId: string }>(
  async (_request, { context, db, env, params }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const validatedParams = workspaceTagParamsSchema.safeParse(params);
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    const service = new WorkspaceService(new WorkspaceStorage(db));
    await service.deleteTag(context, validatedParams.data.tagId);

    return new NextResponse(null, { status: 204 });
  },
);
