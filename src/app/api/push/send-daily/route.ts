import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const { env } = getCloudflareContext();

  // Basic security check for Cron
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb(env.DB);
  const subscriptions = await db.select().from(pushSubscriptions);

  webpush.setVapidDetails(
    "mailto:admin@wig-scoreboard.com",
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({
          title: "WIG 리마인드",
          body: "오늘의 목표를 달성하셨나요? 지금 바로 기록해보세요! ✨",
          icon: "/favicon-192x192.png",
          data: { url: "/dashboard/my" },
        }),
      ),
    ),
  );

  return NextResponse.json({
    total: subscriptions.length,
    success: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  });
}
