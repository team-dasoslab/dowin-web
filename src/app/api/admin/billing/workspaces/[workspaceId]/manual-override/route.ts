import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { AuditLogStorage } from "@/domain/audit/storage/audit-log.storage";
import { AdminBillingService } from "@/domain/billing/services/admin-billing.service";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import {
  adminBillingManualOverrideSchema,
  adminBillingWorkspaceParamsSchema,
} from "@/domain/billing/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { requireAdminRole, requireAdminSession } from "@/lib/server/admin-authz";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const POST = withErrorHandler(
  async (request: Request, context: { params: Promise<{ workspaceId: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await requireAdminSession(db);
    await requireAdminRole(db, session.adminUserId, "SYSTEM_ADMIN");

    const parsedParams = adminBillingWorkspaceParamsSchema.safeParse(
      await context.params,
    );

    if (!parsedParams.success) {
      return await apiError(
        "VALIDATION_ERROR",
        parsedParams.error.flatten().fieldErrors,
      );
    }

    const parsedBody = adminBillingManualOverrideSchema.safeParse(
      await request.json(),
    );

    if (!parsedBody.success) {
      return await apiError(
        "VALIDATION_ERROR",
        parsedBody.error.flatten().fieldErrors,
      );
    }

    const result = await new AdminBillingService(
      new BillingStorage(db),
      new AuditLogStorage(db),
    ).applyManualOverride(session.adminUserId, parsedParams.data.workspaceId, {
      ...parsedBody.data,
    });

    return apiSuccess(result);
  },
);
