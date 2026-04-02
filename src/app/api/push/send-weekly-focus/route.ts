import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { WeeklyFocusPushService } from "@/domain/notification/services/weekly-focus-push.service";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import {
  buildPushPayload,
  type PushSubscription,
} from "@block65/webcrypto-web-push";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const { env } = getCloudflareContext();

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb(env.DB);
  const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: "VAPID keys are not configured" },
      { status: 500 },
    );
  }

  const service = new WeeklyFocusPushService(
    {
      findAllPushSubscriptions: async () =>
        await db.select().from(pushSubscriptions),
    },
    new ScoreboardStorage(db),
    new LeadMeasureStorage(db),
    new DailyLogStorage(db),
  );

  const result = await service.buildWeeklyFocusJobs({
    googleApiKey: env.GEMINI_API_KEY,
  });

  const vapidKeys = {
    subject: "mailto:ixio0330@gmail.com",
    publicKey: vapidPublicKey,
    privateKey: vapidPrivateKey,
  };

  const deliveries = await Promise.allSettled(
    result.jobs.map(async (job) => {
      const subscription: PushSubscription = {
        endpoint: job.endpoint,
        keys: {
          p256dh: job.p256dh,
          auth: job.auth,
        },
        expirationTime: null,
      };

      const payload = await buildPushPayload(
        {
          data: JSON.stringify({
            title: job.title,
            body: job.body,
            icon: "/favicon-192x192.png",
            data: {
              url: job.url,
              pushType: "weekly_focus",
              campaignId: "weekly_focus_v1",
            },
          }),
          options: { ttl: 60 },
        },
        subscription,
        vapidKeys,
      );

      const response = await fetch(
        new Request(job.endpoint, {
          method: payload.method,
          headers: payload.headers,
          body: payload.body as unknown as ArrayBuffer,
        }),
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status} - ${text}`);
      }
    }),
  );

  return NextResponse.json({
    ...result.summary,
    success: deliveries.filter((delivery) => delivery.status === "fulfilled").length,
    failed: deliveries.filter((delivery) => delivery.status === "rejected").length,
  });
}
