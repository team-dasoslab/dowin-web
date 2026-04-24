import { getDb } from "@/db";
import { SESSION_TTL_SECONDS } from "@/domain/auth/constants";
import { AuthService } from "@/domain/auth/services/auth.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { signupSchema } from "@/domain/auth/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { SESSION_COOKIE_SECURE } from "@/lib/server/auth";
import { getLocale } from "@/lib/server/locale";
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
    return await apiError(
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const locale = await getLocale();

  const { user, recoveryCodes, sessionId } = await service.signup(
    parsed.data.customId,
    parsed.data.nickname,
    parsed.data.password,
    locale,
  );

  const cookieStore = await cookies();
  cookieStore.set("dowin_sid", sessionId, {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  // Sync DB locale to browser cookie
  if (user.locale) {
    cookieStore.set("NEXT_LOCALE", user.locale, {
      path: "/",
      maxAge: 31536000,
    });
  }

  return apiSuccess({ user, recoveryCodes }, 201);
});
