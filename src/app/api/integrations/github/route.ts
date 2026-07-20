import { createOAuthService } from "@/domain/github-integration/services/oauth.service";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const GET = withErrorHandler(async (_, { env, db }) => {
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }
  const service = createOAuthService(env);
  const result = await service.getIntegrationStatus(session.userId);

  return apiSuccess(result);
});
