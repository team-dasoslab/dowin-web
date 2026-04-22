import { createHmac, timingSafeEqual } from "node:crypto";

const TIMESTAMP_TOLERANCE_SECONDS = 300;

export type VerifiedPolarWebhook = {
  webhookId: string;
  timestamp: string;
};

function parseSignatureHeader(signatureHeader: string): string[] {
  return signatureHeader
    .split(" ")
    .map((value) => value.trim())
    .filter((value) => value.startsWith("v1,"))
    .map((value) => value.slice(3));
}

function safeCompareBase64(a: string, b: string): boolean {
  const left = Buffer.from(a, "base64");
  const right = Buffer.from(b, "base64");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function verifyPolarWebhookSignature(input: {
  body: string;
  headers: Headers;
  secret: string | null | undefined;
  now?: number;
}): VerifiedPolarWebhook | null {
  const secret = input.secret?.trim();
  const webhookId = input.headers.get("webhook-id");
  const webhookTimestamp = input.headers.get("webhook-timestamp");
  const webhookSignature = input.headers.get("webhook-signature");

  if (!secret || !webhookId || !webhookTimestamp || !webhookSignature) {
    return null;
  }

  const timestampNumber = Number(webhookTimestamp);
  if (!Number.isFinite(timestampNumber)) {
    return null;
  }

  const now = input.now ?? Date.now();
  const ageSeconds = Math.abs(Math.floor(now / 1000) - timestampNumber);
  if (ageSeconds > TIMESTAMP_TOLERANCE_SECONDS) {
    return null;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${input.body}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signedContent)
    .digest("base64");

  const candidates = parseSignatureHeader(webhookSignature);
  const isValid = candidates.some((candidate) =>
    safeCompareBase64(candidate, expectedSignature),
  );

  if (!isValid) {
    return null;
  }

  return {
    webhookId,
    timestamp: webhookTimestamp,
  };
}
