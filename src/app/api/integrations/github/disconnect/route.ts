import { getDb } from "@/db";
import { createOAuthService, GithubEnv } from "@/domain/github-integration/services/oauth.service";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";
import { z } from "zod";

const DisconnectSchema = z.object({
  installationId: z.string(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }
  const body = await req.json().catch(() => ({}));
  const parsed = DisconnectSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.format());
  }

  const service = createOAuthService(env as unknown as GithubEnv);
  await service.disconnectInstallation(session.userId, parsed.data.installationId);

  return apiSuccess({ success: true });
});
