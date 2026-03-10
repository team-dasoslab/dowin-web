import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

import { eq } from "drizzle-orm";

// GET /api/push/test?userId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const db = getDb(env.DB);

  // Find the latest subscription for this user
  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .limit(1);

  if (subscriptions.length === 0) {
    return NextResponse.json(
      { error: "No subscription found for this user" },
      { status: 404 },
    );
  }

  const sub = subscriptions[0];

  try {
    const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error(
        `VAPID keys missing. Public: ${!!vapidPublicKey}, Private: ${!!vapidPrivateKey}. Ensure they are set in Cloudflare secrets.`,
      );
    }

    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      JSON.stringify({
        title: "WIG 테스트 알림 🚀",
        body: "성공적으로 알림이 전송되었습니다! 이제 9시마다 리마인드를 받아보세요.",
        icon: "/favicon-192x192.png",
        data: { url: "/dashboard/my" },
      }),
      {
        vapidDetails: {
          subject: "mailto:ixio0330@gmail.com",
          publicKey: vapidPublicKey,
          privateKey: vapidPrivateKey,
        },
      },
    );
    return NextResponse.json({ success: true, message: "Test push sent!" });
  } catch (error: any) {
    console.error("Test push failed:", error);
    return NextResponse.json(
      {
        error: "Failed to send test push",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
