import { getDb } from "@/db";
import { ContactDiscordNotifierService } from "@/domain/contact/services/contact-discord-notifier.service";
import { ContactInquiryService } from "@/domain/contact/services/contact-inquiry.service";
import { ContactInquiryStorage } from "@/domain/contact/storage/contact-inquiry.storage";
import { adminContactInquiryListQuerySchema } from "@/domain/contact/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { requireAdminSession, requireAnyAdminRole } from "@/lib/server/admin-authz";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";

const createService = (db: ReturnType<typeof getDb>) =>
  new ContactInquiryService(
    new WorkspaceStorage(db),
    new ContactInquiryStorage(db),
    new ContactDiscordNotifierService(),
  );

export const GET = withErrorHandler(async (request: Request, { db }) => {
  const session = await requireAdminSession(db);
  await requireAnyAdminRole(db, session.adminUserId, ["SUPPORT_ADMIN", "SYSTEM_ADMIN"]);

  const url = new URL(request.url);
  const parsed = adminContactInquiryListQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    userId: url.searchParams.get("userId") ?? undefined,
    workspaceId: url.searchParams.get("workspaceId") ?? undefined,
  });

  if (!parsed.success) {
    return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const result = await createService(db).listAdminInquiries(parsed.data);

  return apiSuccess(result);
});
