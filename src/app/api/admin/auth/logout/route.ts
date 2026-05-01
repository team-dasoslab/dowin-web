import { getDb } from "@/db";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import {
  clearAdminSessionCookie,
  deleteAdminSession,
  getAdminSessionTokenFromCookies,
} from "@/lib/server/admin-auth";
import { requireAdminSession } from "@/lib/server/admin-authz";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const POST = withErrorHandler(async () => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await requireAdminSession(db);
  const sessionToken = await getAdminSessionTokenFromCookies();

  if (!session || !sessionToken) {
    return await apiError("UNAUTHORIZED");
  }

  await deleteAdminSession(db, sessionToken);
  await clearAdminSessionCookie();

  return apiSuccess(null, 204);
});
