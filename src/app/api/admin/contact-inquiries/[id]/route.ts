import { getDb } from "@/db";
import { ContactDiscordNotifierService } from "@/domain/contact/services/contact-discord-notifier.service";
import { ContactInquiryService } from "@/domain/contact/services/contact-inquiry.service";
import { ContactInquiryStorage } from "@/domain/contact/storage/contact-inquiry.storage";
import {
  adminContactInquiryUpdateSchema,
  contactInquiryIdParamsSchema,
} from "@/domain/contact/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import {
  requireAdminSession,
  requireAnyAdminRole,
} from "@/lib/server/admin-authz";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const createService = (db: ReturnType<typeof getDb>) =>
  new ContactInquiryService(
    new WorkspaceStorage(db),
    new ContactInquiryStorage(db),
    new ContactDiscordNotifierService(),
  );

export const GET = withErrorHandler(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await requireAdminSession(db);
    await requireAnyAdminRole(db, session.adminUserId, [
      "SUPPORT_ADMIN",
      "SYSTEM_ADMIN",
    ]);

    const parsedParams = contactInquiryIdParamsSchema.safeParse(
      await context.params,
    );

    if (!parsedParams.success) {
      return await apiError(
        "VALIDATION_ERROR",
        parsedParams.error.flatten().fieldErrors,
      );
    }

    const result = await createService(db).getAdminInquiry(parsedParams.data.id);

    return apiSuccess(result);
  },
);

export const PATCH = withErrorHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await requireAdminSession(db);
    await requireAnyAdminRole(db, session.adminUserId, [
      "SUPPORT_ADMIN",
      "SYSTEM_ADMIN",
    ]);

    const parsedParams = contactInquiryIdParamsSchema.safeParse(
      await context.params,
    );

    if (!parsedParams.success) {
      return await apiError(
        "VALIDATION_ERROR",
        parsedParams.error.flatten().fieldErrors,
      );
    }

    const parsedBody = adminContactInquiryUpdateSchema.safeParse(
      await request.json(),
    );

    if (!parsedBody.success) {
      return await apiError(
        "VALIDATION_ERROR",
        parsedBody.error.flatten().fieldErrors,
      );
    }

    const result = await createService(db).updateAdminInquiry(
      parsedParams.data.id,
      {
        status: parsedBody.data.status,
        answerSummary: parsedBody.data.answerSummary,
      },
    );

    return apiSuccess(result);
  },
);
