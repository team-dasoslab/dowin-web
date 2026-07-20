import { AuthService } from "@/domain/auth/services/auth.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { passwordChangeSchema } from "@/domain/auth/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh, SESSION_COOKIE } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { cookies } from "next/headers";

export const PUT = withErrorHandler(async (request: Request, { env, db }) => {
  const storage = new AuthStorage(db);
  const service = new AuthService(storage);

  // 1. 세션 확인
  const session = await getSessionWithRefresh(db);
  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
    db,
    userId: session.userId,
    env,
    intent: "general-write",
  });
  if (restrictedWriteResponse) {
    return restrictedWriteResponse;
  }

  const body = await request.json();
  const parsed = passwordChangeSchema.safeParse(body);

  if (!parsed.success) {
    return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  try {
    await service.changePassword(
      session.userId,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);

    return apiSuccess({ message: "비밀번호가 변경되었습니다." });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "현재 비밀번호가 올바르지 않습니다") {
      return await apiError("WRONG_PASSWORD");
    }
    throw error;
  }
});
