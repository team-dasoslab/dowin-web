import { getDb } from "@/db";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { DailyReminderPushService } from "@/domain/notification/services/daily-reminder-push.service";
import { sendWebPushMessages } from "@/domain/notification/services/web-push";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const { env } = getCloudflareContext();

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: "VAPID keys are not configured" },
      { status: 500 },
    );
  }

  const db = getDb(env.DB);
  const service = new DailyReminderPushService(
    new NotificationStorage(db),
    new ScoreboardStorage(db),
    new LeadMeasureStorage(db),
    new DailyLogStorage(db),
  );
  const result = await service.buildDailyReminderJobs();
  const delivery = await sendWebPushMessages(
    result.jobs.map((job) => ({
      ...job,
      pushType: "daily_reminder",
      campaignId: "daily_reminder_v2",
    })),
    {
      subject: "mailto:ixio0330@gmail.com",
      publicKey: vapidPublicKey,
      privateKey: vapidPrivateKey,
    },
  );

  return NextResponse.json({
    ...result.summary,
    success: delivery.success,
    failed: delivery.failed,
  });
}
