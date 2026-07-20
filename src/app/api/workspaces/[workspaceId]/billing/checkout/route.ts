import { createPolarBillingClient } from "@/domain/billing/polar";
import { BillingService } from "@/domain/billing/services/billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import {
  workspaceBillingCheckoutHeaderSchema,
  workspaceBillingCheckoutSchema,
} from "@/domain/billing/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getLocale } from "@/lib/server/locale";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const POST = withWorkspaceAccess<{ workspaceId: string }>(
  async (request, { context, db, env }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const headers = workspaceBillingCheckoutHeaderSchema.safeParse({
      idempotencyKey: request.headers.get("Idempotency-Key"),
    });

    if (!headers.success) {
      return await apiError(
        "VALIDATION_ERROR",
        headers.error.flatten().fieldErrors,
      );
    }

    const json = await request.json().catch(() => ({}));
    const body = workspaceBillingCheckoutSchema.safeParse(json);

    if (!body.success) {
      return await apiError("VALIDATION_ERROR", body.error.flatten().fieldErrors);
    }

    const locale = await getLocale();
    const service = new BillingService(
      new WorkspaceStorage(db),
      new BillingStorage(db),
      createPolarBillingClient(env),
    );

    const result = await service.startBasicCheckout(
      context,
      {
        seatCount: body.data.seatCount,
        locale,
        idempotencyKey: headers.data.idempotencyKey,
        returnPath: body.data.returnTo,
      },
    );

    return apiSuccess(result, 201);
  },
);
