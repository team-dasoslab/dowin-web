import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import {
  devicePushTokenDisableSchema,
  devicePushTokenRegisterSchema,
} from "@/domain/notification/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";

const ensureDefaultNotificationSettings = async (storage: NotificationStorage, userId: number) => {
  const currentSettings = await storage.findUserNotificationSettings(userId);

  if (currentSettings) {
    return;
  }

  await storage.upsertUserNotificationSettings({
    userId,
    dailyReminderEnabled: true,
    dailyReminderHour: 21,
    dailyReminderMinute: 0,
    timezone: "Asia/Seoul",
  });
};

export const POST = withErrorHandler(async (request: Request, { env, db }) => {
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const parsed = devicePushTokenRegisterSchema.safeParse(await request.json());
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

  const storage = new NotificationStorage(db);

  await storage.upsertDevicePushToken({
    userId: session.userId,
    provider: parsed.data.provider,
    platform: parsed.data.platform,
    token: parsed.data.token,
    appVersion: parsed.data.appVersion ?? null,
    notificationEnabled: parsed.data.notificationEnabled,
  });

  await ensureDefaultNotificationSettings(storage, session.userId);

  return apiSuccess({ success: true });
});

export const DELETE = withErrorHandler(async (request: Request, { env, db }) => {
  const session = await getSessionWithRefresh(db);

  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const parsed = devicePushTokenDisableSchema.safeParse(await request.json());
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

  await new NotificationStorage(db).disableDevicePushTokenForUser(
    session.userId,
    parsed.data.token,
  );

  return apiSuccess({ success: true });
});
