import { getDb } from "@/db";
import { NotificationSettingsService } from "@/domain/notification/services/notification-settings.service";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import { userNotificationTimezoneUpdateSchema } from "@/domain/notification/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";

const createService = (db: ReturnType<typeof getDb>) =>
  new NotificationSettingsService(new NotificationStorage(db), new WorkspaceStorage(db));

export const PUT = withErrorHandler(async (request: Request, { env, db }) => {
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const parsed = userNotificationTimezoneUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
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

  return apiSuccess(await createService(db).updateMyTimezone(session.userId, parsed.data.timezone));
});
