import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { SignupCheckoutService } from "@/domain/auth/services/signup-checkout.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import {
  signupCheckoutHeaderSchema,
  signupCheckoutSchema,
} from "@/domain/auth/validation";
import { createPolarBillingClient } from "@/domain/billing/polar";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getLocale } from "@/lib/server/locale";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);

  const headers = signupCheckoutHeaderSchema.safeParse({
    idempotencyKey: request.headers.get("Idempotency-Key"),
  });

  if (!headers.success) {
    return await apiError("VALIDATION_ERROR", headers.error.flatten().fieldErrors);
  }

  const body = signupCheckoutSchema.safeParse(await request.json());

  if (!body.success) {
    return await apiError("VALIDATION_ERROR", body.error.flatten().fieldErrors);
  }

  const locale = await getLocale();
  const service = new SignupCheckoutService(
    new AuthStorage(db),
    new BillingStorage(db),
    createPolarBillingClient(env),
  );

  const result = await service.prepareSignupCheckout({
    customId: body.data.customId,
    nickname: body.data.nickname,
    password: body.data.password,
    workspaceName: body.data.workspaceName,
    seatCount: body.data.seatCount,
    locale,
    idempotencyKey: headers.data.idempotencyKey,
  });

  return apiSuccess(result, 201);
});
