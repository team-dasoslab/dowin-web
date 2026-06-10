import { describe, expect, it } from "vitest";
import {
  normalizePolarBillingEventPayload,
  sanitizePolarLogBody,
} from "./polar-payload-normalizer";

describe("normalizePolarBillingEventPayload", () => {
  it("결제 증빙에 필요한 필드만 유지하고 민감 결제수단 키를 제거한다", () => {
    const normalized = normalizePolarBillingEventPayload({
      type: "subscription.active",
      timestamp: "2026-06-09T00:00:00.000Z",
      data: {
        id: "sub_1",
        customer_id: "cus_1",
        current_period_end: "2026-07-09T00:00:00.000Z",
        amount: 120000,
        currency: "KRW",
        metadata: {
          workspaceId: "3",
          requestedSeatCount: "5",
          targetPlanCode: "BASIC",
          internalDebugNote: "drop me",
          token: "drop-token",
        },
        payment_method_details: {
          card: {
            number: "4242424242424242",
            cvc: "123",
          },
        },
        billing_address: {
          line1: "drop address",
        },
        customer: {
          id: "cus_1",
          email: "buyer@example.com",
          payment_method: "pm_1",
        },
      },
    });

    expect(normalized).toEqual({
      type: "subscription.active",
      timestamp: "2026-06-09T00:00:00.000Z",
      data: {
        id: "sub_1",
        customer_id: "cus_1",
        current_period_end: "2026-07-09T00:00:00.000Z",
        amount: 120000,
        currency: "KRW",
        metadata: {
          workspaceId: "3",
          requestedSeatCount: "5",
          targetPlanCode: "BASIC",
        },
        customer: {
          id: "cus_1",
        },
      },
    });

    const serialized = JSON.stringify(normalized);
    expect(serialized).not.toContain("4242424242424242");
    expect(serialized).not.toContain("cvc");
    expect(serialized).not.toContain("payment_method");
    expect(serialized).not.toContain("billing_address");
    expect(serialized).not.toContain("buyer@example.com");
  });
});

describe("sanitizePolarLogBody", () => {
  it("Polar API error body도 같은 정책으로 정규화한다", () => {
    expect(
      sanitizePolarLogBody(
        JSON.stringify({
          type: "error",
          timestamp: "2026-06-09T00:00:00.000Z",
          data: {
            id: "err_1",
            card: {
              number: "4242424242424242",
            },
            metadata: {
              workspaceId: "1",
              secret: "drop",
            },
          },
        }),
      ),
    ).toBe(
      JSON.stringify({
        type: "error",
        timestamp: "2026-06-09T00:00:00.000Z",
        data: {
          id: "err_1",
          metadata: {
            workspaceId: "1",
          },
        },
      }),
    );
  });
});
