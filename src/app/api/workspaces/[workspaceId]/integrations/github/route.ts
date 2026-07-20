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

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) => {
    const { workspaceId } = await params;
    const { env } = await getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const parsedParams = workspaceParamsSchema.safeParse({ workspaceId });
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
    const status = await service.getWorkspaceIntegrationStatus(
      resolvedId,
      session.userId,
    );

    return apiSuccess(status);
  },
);
