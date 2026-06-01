import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { createPolarBillingClient } from "@/domain/billing/polar";
import { BillingService } from "@/domain/billing/services/billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { PlatformError } from "@/lib/server/errors";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { NextResponse } from "next/server";

function buildPortalFailureRedirectUrl(
  request: Request,
  workspaceId: string,
  code: string,
) {
  const requestUrl = new URL(request.url);
  const fallbackUrl = new URL(`/${workspaceId}/profile/billing`, requestUrl);
  const referer = request.headers.get("referer");

  let redirectUrl = fallbackUrl;
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.origin === requestUrl.origin) {
        redirectUrl = refererUrl;
      }
    } catch {
      redirectUrl = fallbackUrl;
    }
  }

  redirectUrl.searchParams.set("billing", "portal_error");
  redirectUrl.searchParams.set("code", code);
  return redirectUrl;
}

export const GET = withErrorHandler(
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

    const service = new BillingService(
      new WorkspaceStorage(db),
      new BillingStorage(db),
      createPolarBillingClient(env),
    );

    try {
      const portalUrl = await service.getPortalUrl(workspaceId, session.userId);
      return NextResponse.redirect(portalUrl);
    } catch (error) {
      if (error instanceof PlatformError) {
        console.warn("[billing.portal] redirecting after portal failure", {
          workspaceId,
          userId: session.userId,
          code: error.code,
          statusCode: error.statusCode,
        });
        return NextResponse.redirect(
          buildPortalFailureRedirectUrl(request, workspaceId, error.code),
        );
      }

      throw error;
    }
  },
);
