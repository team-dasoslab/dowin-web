import { getDb } from "@/db";
import { createOAuthService, GithubEnv } from "@/domain/github-integration/services/oauth.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";
import { z } from "zod";

const InstallUrlSchema = z.object({
  workspaceId: z.coerce.number().int().positive(),
  locale: z.enum(["ko", "en"]).default("ko"),
});

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = InstallUrlSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.format());
    }

    const workspaceStorage = new WorkspaceStorage(db);
    const context = await requireWorkspaceAccess(
      workspaceStorage,
      parsed.data.workspaceId,
      session.userId,
    );

    if (context.role !== "ADMIN") {
      return apiError("FORBIDDEN");
    }

    const service = createOAuthService(env as unknown as GithubEnv);
    const result = await service.createInstallUrl(
      session.userId,
      parsed.data.workspaceId,
      parsed.data.locale,
    );

    return apiSuccess(result);
  } catch (error: unknown) {
    console.error("github install-url error:", error);
    return apiError("INTERNAL_ERROR", (error as Error).message);
  }
}
