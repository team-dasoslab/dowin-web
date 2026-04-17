import { getDb } from "@/db";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type PushSubscriptionPayload = {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
};

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
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

  const body = (await request.json()) as PushSubscriptionPayload;
  if (
    !body.subscription?.endpoint ||
    !body.subscription?.keys?.p256dh ||
    !body.subscription?.keys?.auth
  ) {
    return await apiError("VALIDATION_ERROR", {
      subscription: ["유효한 푸시 구독 정보가 필요합니다."],
    });
  }

  const storage = new NotificationStorage(db);

  await storage.upsertPushSubscription({
    userId: session.userId,
    endpoint: body.subscription.endpoint,
    p256dh: body.subscription.keys.p256dh,
    auth: body.subscription.keys.auth,
  });

  const currentSettings = await storage.findUserNotificationSettings(session.userId);
  if (!currentSettings) {
    await storage.upsertUserNotificationSettings({
      userId: session.userId,
      dailyReminderEnabled: true,
      dailyReminderHour: 21,
      dailyReminderMinute: 0,
      timezone: "Asia/Seoul",
    });
  }

  return apiSuccess({ success: true });
});

export const DELETE = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
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

  const body = (await request.json()) as { endpoint?: string };
  if (!body.endpoint) {
    return await apiError("VALIDATION_ERROR", {
      endpoint: ["삭제할 endpoint가 필요합니다."],
    });
  }

  await new NotificationStorage(db).deletePushSubscriptionByEndpoint(body.endpoint);

  return apiSuccess({ success: true });
});
