import { getDb } from "@/db";
import { createRepositoryLinkService } from "@/domain/github-integration/services/repository-link.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceParamsSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";
import { z } from "zod";

const ParamsSchema = workspaceParamsSchema.extend({
  repositoryLinkId: z.coerce.number().int().positive(),
});

export const DELETE = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; repositoryLinkId: string }> },
  ) => {
    const { workspaceId, repositoryLinkId } = await params;
    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const parsedParams = ParamsSchema.safeParse({ workspaceId, repositoryLinkId });
    if (!parsedParams.success) {
      return apiError("VALIDATION_ERROR", parsedParams.error.format());
    }

    const workspaceStorage = new WorkspaceStorage(db);
    const resolvedId = await workspaceStorage.resolveIdByUid(parsedParams.data.workspaceId);
    if (!resolvedId) {
      return apiError("NOT_FOUND", { detail: "워크스페이스를 찾을 수 없습니다." });
    }

    const context = await requireWorkspaceAccess(
      workspaceStorage,
      resolvedId,
      session.userId,
    );

    if (context.role !== "ADMIN") {
      return apiError("FORBIDDEN");
    }

    const service = createRepositoryLinkService(env as unknown as CloudflareEnv);

    try {
      await service.disconnectRepository(
        resolvedId,
        parsedParams.data.repositoryLinkId,
      );

      return apiSuccess({ success: true });
    } catch (error: unknown) {
      console.error("github repository unlink error:", error);
      if ((error as Error).message.includes("not found")) {
        return apiError("NOT_FOUND", (error as Error).message);
      }
      return apiError("INTERNAL_ERROR", (error as Error).message);
    }
  },
);
