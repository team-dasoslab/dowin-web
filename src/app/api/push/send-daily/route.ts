import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";
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
  const subscriptions = await db.select().from(pushSubscriptions);

  const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: "VAPID keys are not configured" },
      { status: 500 },
    );
  }

  const vapidKeys = {
    subject: "mailto:ixio0330@gmail.com",
    publicKey: vapidPublicKey,
    privateKey: vapidPrivateKey,
  };

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const subscription: PushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        expirationTime: null,
      };

      const payload = await buildPushPayload(
        {
          data: JSON.stringify({
            title: "WIG 리마인드",
            body: "오늘의 목표를 달성하셨나요? 지금 바로 기록해보세요! ✨",
            icon: "/favicon-192x192.png",
            data: { url: "/dashboard/my" },
          }),
          options: { ttl: 60 },
        },
        subscription,
        vapidKeys,
      );

      const response = await fetch(
        new Request(sub.endpoint, {
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
    total: subscriptions.length,
    success: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  });
}
