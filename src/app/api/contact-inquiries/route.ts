import { getDb } from "@/db";
import { ContactInquiryService } from "@/domain/contact/services/contact-inquiry.service";
import { ContactDiscordNotifierService } from "@/domain/contact/services/contact-discord-notifier.service";
import { ContactInquiryStorage } from "@/domain/contact/storage/contact-inquiry.storage";
import { contactInquiryCreateSchema } from "@/domain/contact/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { getLocale } from "@/lib/server/locale";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type ContactRouteEnv = CloudflareEnv & {
  CONTACT_DISCORD_WEBHOOK_URL?: string;
};

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const parsed = contactInquiryCreateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const locale = await getLocale();
  const service = new ContactInquiryService(
    new WorkspaceStorage(db),
    new ContactInquiryStorage(db),
    new ContactDiscordNotifierService(),
  );
  const result = await service.createInquiry(
    session.userId,
    {
      ...parsed.data,
      locale,
    },
    {
      webhookUrl: (env as ContactRouteEnv).CONTACT_DISCORD_WEBHOOK_URL,
    },
  );

  return apiSuccess(result, 201);
});
