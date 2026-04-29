import { getDb } from "@/db";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { sendFcmMessages } from "@/domain/notification/services/fcm";
import { WeeklyFocusPushService } from "@/domain/notification/services/weekly-focus-push.service";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";

function getFcmCredentials(env: CloudflareEnv) {
  if (
    !env.FCM_PROJECT_ID ||
    !env.FCM_CLIENT_EMAIL ||
    !env.FCM_PRIVATE_KEY
  ) {
    throw new Error("FCM credentials are not configured");
  }

  return {
    projectId: env.FCM_PROJECT_ID,
    clientEmail: env.FCM_CLIENT_EMAIL,
    privateKey: env.FCM_PRIVATE_KEY,
  };
}

export async function runWeeklyFocusReminder(env: CloudflareEnv) {
  const db = getDb(env.DB);
  const notificationStorage = new NotificationStorage(db);
  const service = new WeeklyFocusPushService(
    notificationStorage,
    new ScoreboardStorage(db),
    new LeadMeasureStorage(db),
    new DailyLogStorage(db),
  );

  const result = await service.buildWeeklyFocusJobs({
    googleApiKey: env.GEMINI_API_KEY,
  });
  const delivery = await sendFcmMessages(
    result.jobs.map((job) => ({
      token: job.token,
      title: job.title,
      body: job.body,
      url: job.url,
      pushType: "weekly_focus",
      campaignId: "weekly_focus_v2",
    })),
    getFcmCredentials(env),
  );

  await notificationStorage.disableDevicePushTokens(delivery.disabledTokens);

  return {
    ...result.summary,
    success: delivery.success,
    failed: delivery.failed,
    disabledTokens: delivery.disabledTokens.length,
  };
}
