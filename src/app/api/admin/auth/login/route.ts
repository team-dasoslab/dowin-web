import { getDb } from "@/db";
import { AdminAuthService } from "@/domain/admin/services/admin-auth.service";
import { AdminAuthStorage } from "@/domain/admin/storage/admin-auth.storage";
import { adminLoginSchema } from "@/domain/admin/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { setAdminSessionCookie } from "@/lib/server/admin-auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const getClientIp = (request: Request) =>
  request.headers.get("cf-connecting-ip") ??
  request.headers.get("x-forwarded-for");

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);

  const parsed = adminLoginSchema.safeParse(await request.json());

  if (!parsed.success) {
    return await apiError(
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const service = new AdminAuthService(new AdminAuthStorage(db));
  const result = await service.login(parsed.data.loginId, parsed.data.password, {
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  await setAdminSessionCookie(result.sessionToken);

  return apiSuccess({
    adminUser: result.adminUser,
    roles: result.roles,
  });
});
