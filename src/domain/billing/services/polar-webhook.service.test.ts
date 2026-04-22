import { describe, expect, it, vi } from "vitest";
import { PolarWebhookService } from "./polar-webhook.service";

describe("PolarWebhookService", () => {
  it("subscription.active를 STANDARD projection으로 반영한다", async () => {
    const findBillingEventByProviderEventId = vi.fn().mockResolvedValue(null);
    const findWorkspaceById = vi.fn().mockResolvedValue({
      id: 3,
      planCode: "FREE",
      billingCustomerExternalRef: null,
      billingOwnerUserId: null,
    });
    const findWorkspaceByCustomerExternalRef = vi.fn();
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 11 });
    const upsertWorkspaceBillingState = vi.fn().mockResolvedValue(undefined);
    const updateWorkspaceBillingProjection = vi.fn().mockResolvedValue(undefined);
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId,
      findWorkspaceById,
      findWorkspaceByCustomerExternalRef,
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    } as never);

    const result = await service.handleWebhook({
      providerEventId: "msg_1",
      payloadJson: JSON.stringify({
        type: "subscription.active",
        timestamp: "2026-04-21T00:00:00.000Z",
        data: {
          id: "sub_1",
          customer_id: "cus_1",
          current_period_end: "2026-05-21T00:00:00.000Z",
          cancel_at_period_end: false,
          metadata: {
            workspaceId: "3",
            adminUserId: "9",
          },
          customer: {
            external_id: "workspace:3",
          },
        },
      }),
      now: new Date("2026-04-21T00:00:00.000Z"),
    });

    expect(result).toEqual({ status: "accepted" });
    expect(appendBillingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 3,
        eventType: "subscription.active",
        customerKey: "cus_1",
        subscriptionKey: "sub_1",
        status: "ACCEPTED",
      }),
    );
    expect(upsertWorkspaceBillingState).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 3,
        billingStatus: "ACTIVE",
        planCode: "STANDARD",
        billingOwnerUserId: 9,
      }),
    );
    expect(updateWorkspaceBillingProjection).toHaveBeenCalledWith({
      workspaceId: 3,
      planCode: "STANDARD",
      billingCustomerExternalRef: "workspace:3",
      billingOwnerUserId: 9,
    });
  });

  it("중복 webhook-id는 무시한다", async () => {
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId: vi.fn().mockResolvedValue({ id: 1 }),
      findWorkspaceById: vi.fn(),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent: vi.fn(),
      upsertWorkspaceBillingState: vi.fn(),
      updateWorkspaceBillingProjection: vi.fn(),
    } as never);

    const result = await service.handleWebhook({
      providerEventId: "msg_dup",
      payloadJson: JSON.stringify({
        type: "subscription.active",
        timestamp: "2026-04-21T00:00:00.000Z",
        data: {},
      }),
    });

    expect(result).toEqual({ status: "ignored" });
  });

  it("customer.state_changed에 활성 구독이 없으면 FREE로 회수한다", async () => {
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 21 });
    const upsertWorkspaceBillingState = vi.fn().mockResolvedValue(undefined);
    const updateWorkspaceBillingProjection = vi.fn().mockResolvedValue(undefined);
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId: vi.fn().mockResolvedValue(null),
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 5,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:5",
        billingOwnerUserId: 8,
      }),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    } as never);

    await service.handleWebhook({
      providerEventId: "msg_state",
      payloadJson: JSON.stringify({
        type: "customer.state_changed",
        timestamp: "2026-04-21T00:00:00.000Z",
        data: {
          id: "cus_5",
          external_id: "workspace:5",
          active_subscriptions: [],
        },
      }),
      now: new Date("2026-04-21T00:00:00.000Z"),
    });

    expect(appendBillingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "customer.state_changed",
        status: "ACCEPTED",
      }),
    );
    expect(upsertWorkspaceBillingState).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 5,
        billingStatus: "EXPIRED",
        planCode: "FREE",
      }),
    );
    expect(updateWorkspaceBillingProjection).toHaveBeenCalledWith({
      workspaceId: 5,
      planCode: "FREE",
      billingCustomerExternalRef: "workspace:5",
      billingOwnerUserId: 8,
    });
  });

  it("subscription.ended를 EXPIRED projection으로 반영한다", async () => {
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 31 });
    const upsertWorkspaceBillingState = vi.fn().mockResolvedValue(undefined);
    const updateWorkspaceBillingProjection = vi.fn().mockResolvedValue(undefined);
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId: vi.fn().mockResolvedValue(null),
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 7,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:7",
        billingOwnerUserId: 4,
      }),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    } as never);

    await service.handleWebhook({
      providerEventId: "msg_ended",
      payloadJson: JSON.stringify({
        type: "subscription.ended",
        timestamp: "2026-04-21T00:00:00.000Z",
        data: {
          id: "sub_ended",
          customer_id: "cus_7",
          current_period_end: "2026-04-21T00:00:00.000Z",
          metadata: {
            workspaceId: "7",
          },
          customer: {
            external_id: "workspace:7",
          },
        },
      }),
      now: new Date("2026-04-21T00:00:00.000Z"),
    });

    expect(appendBillingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "subscription.ended",
        status: "ACCEPTED",
      }),
    );
    expect(upsertWorkspaceBillingState).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 7,
        billingStatus: "EXPIRED",
        planCode: "FREE",
      }),
    );
  });

  it("signed payload가 JSON이 아니면 무시한다", async () => {
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId: vi.fn(),
      findWorkspaceById: vi.fn(),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent: vi.fn(),
      upsertWorkspaceBillingState: vi.fn(),
      updateWorkspaceBillingProjection: vi.fn(),
    } as never);

    const result = await service.handleWebhook({
      providerEventId: "msg_bad_json",
      payloadJson: "{not-json",
    });

    expect(result).toEqual({ status: "ignored" });
  });
});
