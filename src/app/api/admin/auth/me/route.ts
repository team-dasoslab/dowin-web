import { getDb } from "@/db";
import { AdminAuthService } from "@/domain/admin/services/admin-auth.service";
import { AdminAuthStorage } from "@/domain/admin/storage/admin-auth.storage";
import { apiSuccess } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-authz";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = withErrorHandler(async () => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await requireAdminSession(db);

  const result = await new AdminAuthService(
    new AdminAuthStorage(db),
  ).getSessionProfile(session.adminUserId);

  return apiSuccess(result);
});
