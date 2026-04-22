import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { createPolarBillingClient } from "@/domain/billing/polar";
import { BillingService } from "@/domain/billing/services/billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import {
  billingCheckoutBodySchema,
  billingCheckoutHeaderSchema,
} from "@/domain/billing/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const headers = billingCheckoutHeaderSchema.safeParse({
    idempotencyKey: request.headers.get("Idempotency-Key"),
  });

  if (!headers.success) {
    return await apiError("VALIDATION_ERROR", headers.error.flatten().fieldErrors);
  }

  const body = billingCheckoutBodySchema.safeParse(await request.json());

  if (!body.success) {
    return await apiError("VALIDATION_ERROR", body.error.flatten().fieldErrors);
  }

  const service = new BillingService(
    new WorkspaceStorage(db),
    new BillingStorage(db),
    createPolarBillingClient(env),
  );

  const result = await service.prepareCheckout(
    session.userId,
    headers.data.idempotencyKey,
    body.data.locale,
  );

  return apiSuccess(result);
});
