import { getDb } from "@/db";
import { createOAuthService, GithubEnv } from "@/domain/github-integration/services/oauth.service";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }

  try {
    const service = createOAuthService(env as unknown as GithubEnv);
    const result = await service.getIntegrationStatus(session.userId);

    return apiSuccess(result);
  } catch (error: unknown) {
    console.error("github integrations get error:", error);
    return apiError("INTERNAL_ERROR", (error as Error).message);
  }
}
