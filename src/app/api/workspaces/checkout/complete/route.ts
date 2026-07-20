import { createPolarBillingClient } from "@/domain/billing/polar";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { WorkspaceCheckoutService } from "@/domain/workspace/services/workspace-checkout.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceCheckoutCompleteSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { cookies } from "next/headers";

export const POST = withErrorHandler(async (request: Request, { env, db }) => {
  const session = await getSessionWithRefresh(db);
  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const body = workspaceCheckoutCompleteSchema.safeParse(await request.json());

  if (!body.success) {
    return await apiError("VALIDATION_ERROR", body.error.flatten().fieldErrors);
  }

  const service = new WorkspaceCheckoutService(
    new WorkspaceStorage(db),
    new BillingStorage(db),
    createPolarBillingClient(env),
  );

  const result = await service.completeWorkspaceCheckout({
    userId: session.userId,
    workspaceCheckoutId: body.data.workspaceCheckoutId,
    checkoutId: body.data.checkoutId,
  });

  const cookieStore = await cookies();
  cookieStore.set("dowin_workspace_id", result.workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return apiSuccess(result, 201);
});
