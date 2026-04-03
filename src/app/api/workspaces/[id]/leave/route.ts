import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceParamsSchema } from "@/domain/workspace/validation";
import { apiError } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export const DELETE = withErrorHandler(
  async (
    _request: Request,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const storage = new WorkspaceStorage(db);
    const service = new WorkspaceService(storage);

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

    const params = await context.params;
    const parsedParams = workspaceParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      return apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
    }

    await service.leaveWorkspace(parsedParams.data.id, session.userId);

    return new NextResponse(null, { status: 204 });
  },
);
