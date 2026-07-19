import { getDb } from "@/db";
import { createRepositoryLinkService } from "@/domain/github-integration/services/repository-link.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";
import { z } from "zod";

const ParamsSchema = z.object({
  workspaceId: z.coerce.number().int().positive(),
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
    const context = await requireWorkspaceAccess(
      workspaceStorage,
      parsedParams.data.workspaceId,
      session.userId,
    );

    if (context.role !== "ADMIN") {
      return apiError("FORBIDDEN");
    }

    const service = createRepositoryLinkService(env as unknown as CloudflareEnv);

    try {
      await service.disconnectRepository(
        parsedParams.data.workspaceId,
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
