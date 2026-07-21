import { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockHandleWebhook = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/domain/billing/storage/billing.storage", () => ({
  BillingStorage: vi.fn(),
}));

vi.mock("@/domain/billing/services/polar-webhook.service", () => ({
  PolarWebhookService: vi.fn(function MockPolarWebhookService() {
    return {
      handleWebhook: mockHandleWebhook,
    };
  }),
}));

function sign(body: string, secret: string, webhookId: string, timestamp: string) {
  return createHmac("sha256", secret).update(`${webhookId}.${timestamp}.${body}`).digest("base64");
}

describe("POST /api/webhooks/polar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({
      env: {
        DB: {},
        POLAR_WEBHOOK_SECRET: "polar_whs_test_secret",
      },
    });
    mockGetDb.mockReturnValue({});
    mockHandleWebhook.mockResolvedValue({ status: "accepted" });
  });

  it("서명이 유효하지 않으면 403을 반환한다", async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/webhooks/polar", {
        method: "POST",
        body: JSON.stringify({ type: "subscription.active", timestamp: "", data: {} }),
        headers: {
          "webhook-id": "msg_1",
          "webhook-timestamp": timestamp,
          "webhook-signature": "v1,invalid",
        },
      }),
      { params: Promise.resolve({}) },
    );

    expect(response.status).toBe(403);
    expect(mockHandleWebhook).not.toHaveBeenCalled();
  });

  it("서명이 유효하면 webhook을 처리한다", async () => {
    const body = JSON.stringify({
      type: "subscription.active",
      timestamp: "2026-04-21T00:00:00.000Z",
      data: {
        metadata: { workspaceId: "3" },
      },
    });
    const webhookId = "msg_123";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = sign(body, "polar_whs_test_secret", webhookId, timestamp);

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/webhooks/polar", {
        method: "POST",
        body,
        headers: {
          "webhook-id": webhookId,
          "webhook-timestamp": timestamp,
          "webhook-signature": `v1,${signature}`,
        },
      }),
      { params: Promise.resolve({}) },
    );

    expect(response.status).toBe(200);
    expect(mockHandleWebhook).toHaveBeenCalledWith({
      providerEventId: webhookId,
      payloadJson: body,
    });
  });
});
