import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { createPolarBillingClient } from "@/domain/billing/polar";
import { BillingService } from "@/domain/billing/services/billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { NextResponse } from "next/server";

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

  const portalUrl = await service.getPortalUrl(workspaceId, session.userId);
  return NextResponse.redirect(portalUrl);
});
