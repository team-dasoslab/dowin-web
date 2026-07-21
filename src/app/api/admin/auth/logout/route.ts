import {
  clearAdminSessionCookie,
  deleteAdminSession,
  getAdminSessionTokenFromCookies,
} from "@/lib/server/admin-auth";
import { requireAdminSession } from "@/lib/server/admin-authz";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const POST = withErrorHandler(async (_, { db }) => {
  const session = await requireAdminSession(db);
  const sessionToken = await getAdminSessionTokenFromCookies();

  if (!session || !sessionToken) {
    return await apiError("UNAUTHORIZED");
  }

  await deleteAdminSession(db, sessionToken);
  await clearAdminSessionCookie();

  return apiSuccess(null, 204);
});
