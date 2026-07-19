import { getDb } from "@/db";
import { createOAuthService, GithubEnv } from "@/domain/github-integration/services/oauth.service";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";
import { z } from "zod";

const DisconnectSchema = z.object({
  installationId: z.string(),
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
    const parsed = DisconnectSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.format());
    }

    const service = createOAuthService(env as unknown as GithubEnv);
    await service.disconnectInstallation(session.userId, parsed.data.installationId);

    return apiSuccess({ success: true });
  } catch (error: unknown) {
    console.error("github disconnect error:", error);
    return apiError("INTERNAL_ERROR", (error as Error).message);
  }
}
