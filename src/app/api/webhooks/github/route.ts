import {
  createWebhookService,
  type GithubInstallationRepositoriesPayload,
} from "@/domain/github-integration/services/webhook.service";
import { verifyWebhookSignature } from "@/domain/github-integration/utils/webhook.utils";
import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/server/with-error-handler";

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

export const POST = withErrorHandler(async (req, { env }) => {
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

  // Only handle supported events
  const supportedEvents = ["pull_request", "installation_repositories"];
  if (!supportedEvents.includes(eventName)) {
    return NextResponse.json({ ok: true, skipped: `event=${eventName}` });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const service = createWebhookService(env);
  let result;

  switch (eventName) {
    case "pull_request":
      result = await service.handlePullRequestEvent(deliveryId, payload as GithubPrPayload);
      break;
    case "installation_repositories":
      result = await service.handleInstallationRepositoriesEvent(
        deliveryId,
        payload as GithubInstallationRepositoriesPayload,
      );
      break;
  }

  return NextResponse.json({ ok: true, ...result });
});
