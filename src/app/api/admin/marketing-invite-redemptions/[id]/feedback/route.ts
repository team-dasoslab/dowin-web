import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { AuditLogStorage } from "@/domain/audit/storage/audit-log.storage";
import { MarketingInviteService } from "@/domain/marketing-invite/services/marketing-invite.service";
import { MarketingInviteStorage } from "@/domain/marketing-invite/storage/marketing-invite.storage";
import {
  marketingInviteRedemptionFeedbackUpdateSchema,
  marketingInviteRedemptionParamsSchema,
} from "@/domain/marketing-invite/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import {
  requireAdminSession,
  requireAnyAdminRole,
} from "@/lib/server/admin-authz";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const PATCH = withErrorHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await requireAdminSession(db);
    await requireAnyAdminRole(db, session.adminUserId, [
      "SUPPORT_ADMIN",
      "SYSTEM_ADMIN",
    ]);

    const parsedParams = marketingInviteRedemptionParamsSchema.safeParse(
      await context.params,
    );
    if (!parsedParams.success) {
      return await apiError(
        "VALIDATION_ERROR",
        parsedParams.error.flatten().fieldErrors,
      );
    }

    const parsedBody = marketingInviteRedemptionFeedbackUpdateSchema.safeParse(
      await request.json(),
    );
    if (!parsedBody.success) {
      return await apiError(
        "VALIDATION_ERROR",
        parsedBody.error.flatten().fieldErrors,
      );
    }

    const result = await new MarketingInviteService(
      new MarketingInviteStorage(db),
      new AuditLogStorage(db),
    ).updateRedemptionFeedback(
      session.adminUserId,
      parsedParams.data.id,
      parsedBody.data,
    );

    return apiSuccess(result);
  },
);
