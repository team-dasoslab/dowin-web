import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyPolarWebhookSignature } from "./polar-webhook";

function createSignature(params: {
  body: string;
  secret: string;
  webhookId: string;
  timestamp: string;
}) {
  return createHmac("sha256", params.secret)
    .update(`${params.webhookId}.${params.timestamp}.${params.body}`)
    .digest("base64");
}

describe("verifyPolarWebhookSignature", () => {
  it("유효한 Standard Webhooks 서명을 검증한다", () => {
    const body = JSON.stringify({
      type: "subscription.active",
      timestamp: "2026-04-21T00:00:00.000Z",
      data: {},
    });
    const secret = "polar_whs_test_secret";
    const webhookId = "msg_123";
    const timestamp = String(Math.floor(Date.UTC(2026, 3, 21) / 1000));
    const signature = createSignature({
      body,
      secret,
      webhookId,
      timestamp,
    });
    const headers = new Headers({
      "webhook-id": webhookId,
      "webhook-timestamp": timestamp,
      "webhook-signature": `v1,${signature}`,
    });

    const result = verifyPolarWebhookSignature({
      body,
      headers,
      secret,
      now: Date.UTC(2026, 3, 21),
    });

    expect(result).toEqual({
      webhookId,
      timestamp,
    });
  });

  it("서명이 틀리면 null을 반환한다", () => {
    const result = verifyPolarWebhookSignature({
      body: "{}",
      headers: new Headers({
        "webhook-id": "msg_123",
        "webhook-timestamp": String(Math.floor(Date.UTC(2026, 3, 21) / 1000)),
        "webhook-signature": "v1,invalid",
      }),
      secret: "polar_whs_test_secret",
      now: Date.UTC(2026, 3, 21),
    });

    expect(result).toBeNull();
  });

  it("timestamp 허용 범위를 벗어나면 null을 반환한다", () => {
    const body = "{}";
    const secret = "polar_whs_test_secret";
    const webhookId = "msg_123";
    const timestamp = String(Math.floor(Date.UTC(2026, 3, 21) / 1000) - 600);
    const signature = createSignature({
      body,
      secret,
      webhookId,
      timestamp,
    });

    const result = verifyPolarWebhookSignature({
      body,
      headers: new Headers({
        "webhook-id": webhookId,
        "webhook-timestamp": timestamp,
        "webhook-signature": `v1,${signature}`,
      }),
      secret,
      now: Date.UTC(2026, 3, 21),
    });

    expect(result).toBeNull();
  });
});
