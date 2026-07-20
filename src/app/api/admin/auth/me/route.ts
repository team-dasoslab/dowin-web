import { AdminAuthService } from "@/domain/admin/services/admin-auth.service";
import { AdminAuthStorage } from "@/domain/admin/storage/admin-auth.storage";
import { requireAdminSession } from "@/lib/server/admin-authz";
import { apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const GET = withErrorHandler(async (_, { db }) => {
  const session = await requireAdminSession(db);

  const result = await new AdminAuthService(new AdminAuthStorage(db)).getSessionProfile(
    session.adminUserId,
  );

  return apiSuccess(result);
});
