import { getDb } from "@/db";
import { AuthService } from "@/domain/auth/services/auth.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { passwordChangeSchema } from "@/domain/auth/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSession } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const PUT = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const storage = new AuthStorage(db);
  const service = new AuthService(storage);

  // 1. 세션 확인
  const session = await getSession(db);
  if (!session) {
    return apiError("UNAUTHORIZED");
  }

  const body = await request.json();
  const parsed = passwordChangeSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  try {
    await service.changePassword(
      session.userId,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    return apiSuccess({ message: "비밀번호가 변경되었습니다." });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "현재 비밀번호가 올바르지 않습니다"
    ) {
      return apiError("WRONG_PASSWORD");
    }
    throw error;
  }
});
