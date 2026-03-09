import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { subscription: any; userId: string };
    const { subscription, userId } = body;
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);

    // Save or update subscription
    await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
