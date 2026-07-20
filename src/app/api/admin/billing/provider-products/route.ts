import { AuditLogStorage } from "@/domain/audit/storage/audit-log.storage";
import { AdminBillingService } from "@/domain/billing/services/admin-billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { adminBillingProviderProductUpsertSchema } from "@/domain/billing/validation";
import {
  requireAdminRole,
  requireAdminSession,
  requireAnyAdminRole,
} from "@/lib/server/admin-authz";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const GET = withErrorHandler(async (_, { db }) => {
  const session = await requireAdminSession(db);
  await requireAnyAdminRole(db, session.adminUserId, ["SUPPORT_ADMIN", "SYSTEM_ADMIN"]);

  const result = await new AdminBillingService(
    new BillingStorage(db),
    new AuditLogStorage(db),
  ).listProviderProducts();

  return apiSuccess(result);
});

export const POST = withErrorHandler(async (request: Request, { db }) => {
  const session = await requireAdminSession(db);
  await requireAdminRole(db, session.adminUserId, "SYSTEM_ADMIN");
  const parsedBody = adminBillingProviderProductUpsertSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return await apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
  }

  const result = await new AdminBillingService(
    new BillingStorage(db),
    new AuditLogStorage(db),
  ).upsertProviderProduct(session.adminUserId, parsedBody.data);

  return apiSuccess(result);
});
