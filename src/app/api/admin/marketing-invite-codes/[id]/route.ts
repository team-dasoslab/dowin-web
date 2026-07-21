import { AuditLogStorage } from "@/domain/audit/storage/audit-log.storage";
import { MarketingInviteService } from "@/domain/marketing-invite/services/marketing-invite.service";
import { MarketingInviteStorage } from "@/domain/marketing-invite/storage/marketing-invite.storage";
import {
  marketingInviteCodeParamsSchema,
  marketingInviteCodeUpdateSchema,
} from "@/domain/marketing-invite/validation";
import { requireAdminSession, requireAnyAdminRole } from "@/lib/server/admin-authz";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const GET = withErrorHandler(async (_request: Request, ctx) => {
  const { db } = ctx;
  const session = await requireAdminSession(db);
  await requireAnyAdminRole(db, session.adminUserId, ["SUPPORT_ADMIN", "SYSTEM_ADMIN"]);

  const parsedParams = marketingInviteCodeParamsSchema.safeParse(await ctx.params);
  if (!parsedParams.success) {
    return await apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
  }

  const result = await new MarketingInviteService(
    new MarketingInviteStorage(db),
    new AuditLogStorage(db),
  ).getCodeDetail(parsedParams.data.id);

  return apiSuccess(result);
});

export const PATCH = withErrorHandler(async (request: Request, ctx) => {
  const { db } = ctx;
  const session = await requireAdminSession(db);
  await requireAnyAdminRole(db, session.adminUserId, ["SUPPORT_ADMIN", "SYSTEM_ADMIN"]);

  const parsedParams = marketingInviteCodeParamsSchema.safeParse(await ctx.params);
  if (!parsedParams.success) {
    return await apiError("VALIDATION_ERROR", parsedParams.error.flatten().fieldErrors);
  }

  const parsedBody = marketingInviteCodeUpdateSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return await apiError("VALIDATION_ERROR", parsedBody.error.flatten().fieldErrors);
  }

  const result = await new MarketingInviteService(
    new MarketingInviteStorage(db),
    new AuditLogStorage(db),
  ).updateCode(session.adminUserId, parsedParams.data.id, parsedBody.data);

  return apiSuccess(result);
});
