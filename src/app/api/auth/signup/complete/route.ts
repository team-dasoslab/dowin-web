import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { SESSION_TTL_SECONDS } from "@/domain/auth/constants";
import { SignupCompletionService } from "@/domain/auth/services/signup-completion.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { signupCompleteSchema } from "@/domain/auth/validation";
import { createPolarBillingClient } from "@/domain/billing/polar";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { SESSION_COOKIE_SECURE } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { cookies } from "next/headers";

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const body = signupCompleteSchema.safeParse(await request.json());

  if (!body.success) {
    return await apiError("VALIDATION_ERROR", body.error.flatten().fieldErrors);
  }

  const service = new SignupCompletionService(
    new AuthStorage(db),
    createPolarBillingClient(env),
  );
  const { user, recoveryCodes, sessionId } = await service.completeSignup({
    signupIntentId: body.data.signupIntentId,
    checkoutId: body.data.checkoutId,
  });

  const cookieStore = await cookies();
  cookieStore.set("dowin_sid", sessionId, {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  if (user.locale) {
    cookieStore.set("NEXT_LOCALE", user.locale, {
      path: "/",
      maxAge: 31536000,
    });
  }

  return apiSuccess({ user, recoveryCodes }, 201);
});
