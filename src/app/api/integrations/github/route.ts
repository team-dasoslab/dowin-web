import { getDb } from "@/db";
import { createOAuthService, GithubEnv } from "@/domain/github-integration/services/oauth.service";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = withErrorHandler(async () => {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }
  const service = createOAuthService(env as unknown as GithubEnv);
  const result = await service.getIntegrationStatus(session.userId);

  return apiSuccess(result);
});
