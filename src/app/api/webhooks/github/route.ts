import { createWebhookService } from "@/domain/github-integration/services/webhook.service";
import { verifyWebhookSignature } from "@/domain/github-integration/utils/webhook.utils";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

type GithubPrPayload = {
  action: string;
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    state: string;
    merged: boolean;
    merged_at: string | null;
  };
  repository: { id: number };
  installation: { id: number };
};

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext();

  const deliveryId = req.headers.get("X-GitHub-Delivery");
  const eventName = req.headers.get("X-GitHub-Event");
  const signatureHeader = req.headers.get("X-Hub-Signature-256");
  const webhookSecret = (env as unknown as Record<string, string>).GITHUB_WEBHOOK_SECRET;

  if (!deliveryId || !eventName) {
    return NextResponse.json({ error: "Missing GitHub headers" }, { status: 400 });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();

  // Verify HMAC-SHA256 signature
  const isValid = await verifyWebhookSignature(webhookSecret, rawBody, signatureHeader);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Only handle pull_request events
  if (eventName !== "pull_request") {
    return NextResponse.json({ ok: true, skipped: `event=${eventName}` });
  }

  let payload: GithubPrPayload;
  try {
    payload = JSON.parse(rawBody) as GithubPrPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const service = createWebhookService(env);
    const result = await service.handlePullRequestEvent(deliveryId, payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    console.error("github webhook error:", error);
    // Return 200 to prevent GitHub from retrying for permanent errors
    return NextResponse.json({
      ok: false,
      error: (error as Error).message,
    });
  }
}
