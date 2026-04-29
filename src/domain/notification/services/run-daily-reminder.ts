import { getDb } from "@/db";
import { DailyReminderPushService } from "@/domain/notification/services/daily-reminder-push.service";
import { sendFcmMessages } from "@/domain/notification/services/fcm";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";

export const runDailyReminder = async (env: CloudflareEnv) => {
  if (!env.FCM_PROJECT_ID || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
    throw new Error("FCM credentials are not configured");
  }

  const db = getDb(env.DB);
  const notificationStorage = new NotificationStorage(db);
  const service = new DailyReminderPushService(notificationStorage);
  const result = await service.buildDailyReminderJobs();
  const delivery = await sendFcmMessages(
    result.jobs.map((job) => ({
      token: job.token,
      title: job.title,
      body: job.body,
      url: job.url,
      pushType: "daily_reminder",
      campaignId: "daily_reminder_v2",
    })),
    {
      projectId: env.FCM_PROJECT_ID,
      clientEmail: env.FCM_CLIENT_EMAIL,
      privateKey: env.FCM_PRIVATE_KEY,
    },
  );
  await notificationStorage.disableDevicePushTokens(delivery.disabledTokens);

  return {
    ...result.summary,
    success: delivery.success,
    failed: delivery.failed,
    disabledTokens: delivery.disabledTokens.length,
  };
};
