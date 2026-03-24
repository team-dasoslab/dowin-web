import { getDb } from "@/db";
import { AuthService } from "@/domain/auth/services/auth.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { recoveryCodeVerifySchema } from "@/domain/auth/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const storage = new AuthStorage(db);
  const service = new AuthService(storage);

  const body = await request.json();
  const parsed = recoveryCodeVerifySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const user = await service.verifyRecoveryCode(parsed.data.recoveryCode);
  return apiSuccess({ user });
});
