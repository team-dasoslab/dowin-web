import { AuditLogStorage } from "@/domain/audit/storage/audit-log.storage";
import { MarketingInviteService } from "@/domain/marketing-invite/services/marketing-invite.service";
import { MarketingInviteStorage } from "@/domain/marketing-invite/storage/marketing-invite.storage";
import { marketingInviteRedeemSchema } from "@/domain/marketing-invite/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const POST = withErrorHandler(async (request: Request, { env, db }) => {
  const session = await getSessionWithRefresh(db);
  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
    db,
    userId: session.userId,
    env,
    intent: "general-write",
  });
  if (restrictedWriteResponse) {
    return restrictedWriteResponse;
  }

  const parsed = marketingInviteRedeemSchema.safeParse(await request.json());
  if (!parsed.success) {
    return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const result = await new MarketingInviteService(
    new MarketingInviteStorage(db),
    new AuditLogStorage(db),
  ).redeemCode(session.userId, parsed.data);

  return apiSuccess(result, 201);
});
