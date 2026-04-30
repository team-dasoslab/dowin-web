import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { getDb } from "@/db";
import { ContactDiscordNotifierService } from "@/domain/contact/services/contact-discord-notifier.service";
import { ContactInquiryService } from "@/domain/contact/services/contact-inquiry.service";
import { ContactInquiryStorage } from "@/domain/contact/storage/contact-inquiry.storage";
import { contactInquiryCreateSchema } from "@/domain/contact/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { getLocale } from "@/lib/server/locale";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const createService = (db: ReturnType<typeof getDb>) =>
  new ContactInquiryService(
    new WorkspaceStorage(db),
    new ContactInquiryStorage(db),
    new ContactDiscordNotifierService(),
  );

export const GET = withErrorHandler(async () => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const result = await createService(db).listMyInquiries(session.userId);

  return apiSuccess(result);
});

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const parsed = contactInquiryCreateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return await apiError(
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const locale = await getLocale();
  const result = await createService(db).createInquiry(
    session.userId,
    {
      ...parsed.data,
      locale,
    },
    {
      webhookUrl: serverRuntimeConfig.contactDiscordWebhookUrl,
    },
  );

  return apiSuccess(result, 201);
});
