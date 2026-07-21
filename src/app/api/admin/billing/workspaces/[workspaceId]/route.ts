import { AuditLogStorage } from "@/domain/audit/storage/audit-log.storage";
import { AdminBillingService } from "@/domain/billing/services/admin-billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { adminBillingWorkspaceParamsSchema } from "@/domain/billing/validation";
import { requireAdminSession, requireAnyAdminRole } from "@/lib/server/admin-authz";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const GET = withErrorHandler(async (_request: Request, ctx) => {
  const { db } = ctx;
  const session = await requireAdminSession(db);
  await requireAnyAdminRole(db, session.adminUserId, ["SUPPORT_ADMIN", "SYSTEM_ADMIN"]);

  const parsedParams = adminBillingWorkspaceParamsSchema.safeParse(await ctx.params);

  if (!parsedParams.success) {
    return await apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
  }

  const result = await new AdminBillingService(
    new BillingStorage(db),
    new AuditLogStorage(db),
  ).getWorkspaceDetail(parsedParams.data.workspaceId);

  return apiSuccess(result);
});
