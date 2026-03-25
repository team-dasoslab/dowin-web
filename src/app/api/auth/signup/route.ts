import { SESSION_TTL_SECONDS } from "@/domain/auth/constants";
import { getDb } from "@/db";
import { AuthService } from "@/domain/auth/services/auth.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { signupSchema } from "@/domain/auth/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { SESSION_COOKIE_SECURE } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const storage = new AuthStorage(db);
  const service = new AuthService(storage);

  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const { user, recoveryCodes, sessionId } = await service.signup(
    parsed.data.customId,
    parsed.data.nickname,
    parsed.data.password,
  );

  const cookieStore = await cookies();
  cookieStore.set("wig_sid", sessionId, {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return apiSuccess({ user, recoveryCodes }, 201);
});
