import { verifyPolarWebhookSignature } from "@/domain/billing/polar-webhook";
import { PolarWebhookService } from "@/domain/billing/services/polar-webhook.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const POST = withErrorHandler(async (request: Request, { env, db }) => {
  const body = await request.text();

  const verified = verifyPolarWebhookSignature({
    body,
    headers: request.headers,
    secret: env.POLAR_WEBHOOK_SECRET,
  });

  if (!verified) {
    return new Response(null, { status: 403 });
  }

  const service = new PolarWebhookService(new BillingStorage(db));

  await service.handleWebhook({
    providerEventId: verified.webhookId,
    payloadJson: body,
  });

  return new Response(null, { status: 200 });
});
