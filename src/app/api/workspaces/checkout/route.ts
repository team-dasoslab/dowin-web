import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { createPolarBillingClient } from "@/domain/billing/polar";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { WorkspaceCheckoutService } from "@/domain/workspace/services/workspace-checkout.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  workspaceCheckoutHeaderSchema,
  workspaceCheckoutSchema,
} from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { getLocale } from "@/lib/server/locale";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);

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

  const headers = workspaceCheckoutHeaderSchema.safeParse({
    idempotencyKey: request.headers.get("Idempotency-Key"),
  });

  if (!headers.success) {
    return await apiError("VALIDATION_ERROR", headers.error.flatten().fieldErrors);
  }

  const body = workspaceCheckoutSchema.safeParse(await request.json());

  if (!body.success) {
    return await apiError("VALIDATION_ERROR", body.error.flatten().fieldErrors);
  }

  const locale = await getLocale();
  const service = new WorkspaceCheckoutService(
    new WorkspaceStorage(db),
    new BillingStorage(db),
    createPolarBillingClient(env),
  );

  const result = await service.prepareWorkspaceCheckout({
    userId: session.userId,
    workspaceName: body.data.workspaceName,
    seatCount: body.data.seatCount,
    locale,
    idempotencyKey: headers.data.idempotencyKey,
  });

  return apiSuccess(result, 201);
});
