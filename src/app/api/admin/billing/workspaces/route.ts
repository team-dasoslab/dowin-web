import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { AuditLogStorage } from "@/domain/audit/storage/audit-log.storage";
import { AdminBillingService } from "@/domain/billing/services/admin-billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { adminBillingWorkspaceListQuerySchema } from "@/domain/billing/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import {
  requireAdminSession,
  requireAnyAdminRole,
} from "@/lib/server/admin-authz";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const GET = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await requireAdminSession(db);
  await requireAnyAdminRole(db, session.adminUserId, [
    "SUPPORT_ADMIN",
    "SYSTEM_ADMIN",
  ]);

  const url = new URL(request.url);
  const parsed = adminBillingWorkspaceListQuerySchema.safeParse({
    workspaceId: url.searchParams.get("workspaceId") ?? undefined,
    workspaceName: url.searchParams.get("workspaceName") ?? undefined,
  });

  if (!parsed.success) {
    return await apiError(
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const result = await new AdminBillingService(
    new BillingStorage(db),
    new AuditLogStorage(db),
  ).listWorkspaces(parsed.data);

  return apiSuccess(result);
});
