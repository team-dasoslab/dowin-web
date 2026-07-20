import { createPolarBillingClient } from "@/domain/billing/polar";
import { BillingService } from "@/domain/billing/services/billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { workspaceBillingSeatUpdateSchema } from "@/domain/billing/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const PATCH = withWorkspaceAccess<{ workspaceId: string }>(
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

    const json = await request.json().catch(() => ({}));
    const body = workspaceBillingSeatUpdateSchema.safeParse(json);

    if (!body.success) {
      return await apiError("VALIDATION_ERROR", body.error.flatten().fieldErrors);
    }

    const service = new BillingService(
      new WorkspaceStorage(db),
      new BillingStorage(db),
      createPolarBillingClient(env),
    );

    const result = await service.updateSubscriptionSeats(context, {
      seatCount: body.data.seatCount,
    });

    return apiSuccess(result);
  },
);
