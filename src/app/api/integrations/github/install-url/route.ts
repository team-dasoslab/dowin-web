import { getDb } from "@/db";
import { createOAuthService, GithubEnv } from "@/domain/github-integration/services/oauth.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";
import { z } from "zod";

const InstallUrlSchema = z.object({
  workspaceId: z.string().optional(),
  locale: z.enum(["ko", "en"]).default("ko"),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }
  const body = await req.json().catch(() => ({}));
  const parsed = InstallUrlSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.format());
  }

  let resolvedWorkspaceId: number | undefined;

  if (parsed.data.workspaceId) {
    const workspaceStorage = new WorkspaceStorage(db);
    const resolved = await workspaceStorage.resolveIdByUid(parsed.data.workspaceId);

    if (!resolved) {
      return apiError("NOT_FOUND", { detail: "워크스페이스를 찾을 수 없습니다." });
    }
    resolvedWorkspaceId = resolved;

    const context = await requireWorkspaceAccess(
      workspaceStorage,
      resolvedWorkspaceId,
      session.userId,
    );

    if (context.role !== "ADMIN") {
      return apiError("FORBIDDEN");
    }
  }

  const service = createOAuthService(env as unknown as GithubEnv);
  const result = await service.createInstallUrl(
    session.userId,
    parsed.data.locale,
    resolvedWorkspaceId,
  );

  return apiSuccess(result);
});
