import { getDb } from "@/db";
import { NotificationSettingsService } from "@/domain/notification/services/notification-settings.service";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import {
  parseTimeString,
  userNotificationSettingsUpdateSchema,
} from "@/domain/notification/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";

const createService = (db: ReturnType<typeof getDb>) =>
  new NotificationSettingsService(new NotificationStorage(db), new WorkspaceStorage(db));

export const GET = withErrorHandler(async (_, { db }) => {
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  return apiSuccess(await createService(db).getMySettings(session.userId));
});

export const PUT = withErrorHandler(async (request: Request, { env, db }) => {
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const parsed = userNotificationSettingsUpdateSchema.safeParse(await request.json());
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

  const time = parseTimeString(parsed.data.dailyReminderTime);
  if (!time) {
    return await apiError("VALIDATION_ERROR", {
      dailyReminderTime: ["시간은 HH:mm 형식이어야 합니다."],
    });
  }

  return apiSuccess(
    await createService(db).updateMySettings(session.userId, {
      dailyReminderEnabled: parsed.data.dailyReminderEnabled,
      dailyReminderHour: time.hour,
      dailyReminderMinute: time.minute,
    }),
  );
});
