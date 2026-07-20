import { AuditLogStorage } from "@/domain/audit/storage/audit-log.storage";
import { AdminBillingService } from "@/domain/billing/services/admin-billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { requireAdminRole, requireAdminSession } from "@/lib/server/admin-authz";
import { apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const POST = withErrorHandler(async (_, { db }) => {
  const session = await requireAdminSession(db);
  await requireAdminRole(db, session.adminUserId, "SYSTEM_ADMIN");

  const result = await new AdminBillingService(
    new BillingStorage(db),
    new AuditLogStorage(db),
  ).syncAllWorkspaceBillingStatuses(session.adminUserId);

  return apiSuccess(result);
});
