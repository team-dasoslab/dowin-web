import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { createPolarBillingClient } from "@/domain/billing/polar";
import { BillingService } from "@/domain/billing/services/billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const GET = withErrorHandler(async (request: Request, { params }: { params: Promise<{ workspaceId: string }> }) => {
  const { workspaceId } = await params;
const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const service = new BillingService(
    new WorkspaceStorage(db),
    new BillingStorage(db),
    createPolarBillingClient(env),
  );

  const result = await service.getMyBilling(workspaceId, session.userId);
  return apiSuccess(result);
});
