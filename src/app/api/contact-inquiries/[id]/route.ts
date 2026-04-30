import { getDb } from "@/db";
import { ContactInquiryService } from "@/domain/contact/services/contact-inquiry.service";
import { ContactDiscordNotifierService } from "@/domain/contact/services/contact-discord-notifier.service";
import { ContactInquiryStorage } from "@/domain/contact/storage/contact-inquiry.storage";
import { contactInquiryIdParamsSchema } from "@/domain/contact/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const createService = (db: ReturnType<typeof getDb>) =>
  new ContactInquiryService(
    new WorkspaceStorage(db),
    new ContactInquiryStorage(db),
    new ContactDiscordNotifierService(),
  );

export const GET = withErrorHandler(
  async (
    _request: Request,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return await apiError("UNAUTHORIZED");
    }

    const params = contactInquiryIdParamsSchema.safeParse(await context.params);

    if (!params.success) {
      return await apiError("VALIDATION_ERROR", params.error.flatten().fieldErrors);
    }

    const result = await createService(db).getMyInquiry(
      session.userId,
      params.data.id,
    );

    return apiSuccess(result);
  },
);
