import { AuditLogStorage } from "@/domain/audit/storage/audit-log.storage";
import { MarketingInviteService } from "@/domain/marketing-invite/services/marketing-invite.service";
import { MarketingInviteStorage } from "@/domain/marketing-invite/storage/marketing-invite.storage";
import { marketingInviteCodeCreateSchema } from "@/domain/marketing-invite/validation";
import { requireAdminSession, requireAnyAdminRole } from "@/lib/server/admin-authz";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const GET = withErrorHandler(async (_, { db }) => {
  const session = await requireAdminSession(db);
  await requireAnyAdminRole(db, session.adminUserId, ["SUPPORT_ADMIN", "SYSTEM_ADMIN"]);

  const result = await new MarketingInviteService(
    new MarketingInviteStorage(db),
    new AuditLogStorage(db),
  ).listCodes();

  return apiSuccess(result);
});

export const POST = withErrorHandler(async (request: Request, { db }) => {
  const session = await requireAdminSession(db);
  await requireAnyAdminRole(db, session.adminUserId, ["SUPPORT_ADMIN", "SYSTEM_ADMIN"]);

  const parsed = marketingInviteCodeCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const result = await new MarketingInviteService(
    new MarketingInviteStorage(db),
    new AuditLogStorage(db),
  ).createCode(session.adminUserId, parsed.data);

  return apiSuccess(result, 201);
});
