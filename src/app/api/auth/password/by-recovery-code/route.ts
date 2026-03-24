import { getDb } from "@/db";
import { AuthService } from "@/domain/auth/services/auth.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { passwordResetByRecoveryCodeSchema } from "@/domain/auth/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const PUT = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const storage = new AuthStorage(db);
  const service = new AuthService(storage);

  const body = await request.json();
  const parsed = passwordResetByRecoveryCodeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  await service.resetPasswordByRecoveryCode(
    parsed.data.recoveryCode,
    parsed.data.newPassword,
  );

  return apiSuccess({ message: "비밀번호가 변경되었습니다." });
});
