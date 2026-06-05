import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { createPolarBillingClient } from "@/domain/billing/polar";
import { BillingService } from "@/domain/billing/services/billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { workspaceBillingSeatUpdateSchema } from "@/domain/billing/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const PATCH = withErrorHandler(
  async (
    request: Request,
    { params }: { params: Promise<{ workspaceId: string }> },
  ) => {
    const { workspaceId } = await params;
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

    const result = await service.updateSubscriptionSeats({
      workspaceUid: workspaceId,
      userId: session.userId,
      seatCount: body.data.seatCount,
    });

    return apiSuccess(result);
  },
);
