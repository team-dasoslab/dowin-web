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
        entitlementSource: "POLAR",
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

  it("subscription.active BASIC seats를 seat entitlement에 반영한다", async () => {
    const upsertWorkspaceSeatEntitlement = vi.fn().mockResolvedValue(undefined);
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId: vi.fn().mockResolvedValue(null),
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 13,
        planCode: "BASIC",
        billingCustomerExternalRef: "workspace-checkout:pending_13",
        billingOwnerUserId: 21,
      }),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent: vi.fn().mockResolvedValue({ id: 51 }),
      upsertWorkspaceBillingState: vi.fn().mockResolvedValue(undefined),
      upsertWorkspaceSeatEntitlement,
      updateWorkspaceBillingProjection: vi.fn().mockResolvedValue(undefined),
    } as never);

    await service.handleWebhook({
      providerEventId: "msg_basic_active",
      payloadJson: JSON.stringify({
        type: "subscription.active",
        timestamp: "2026-05-28T00:00:00.000Z",
        data: {
          id: "sub_basic",
          customer_id: "cus_basic",
          current_period_end: "2026-06-28T00:00:00.000Z",
          cancel_at_period_end: false,
          seats: 5,
          metadata: {
            targetPlanCode: "BASIC",
            workspaceId: "13",
            requestedByUserId: "21",
          },
          customer: {
            external_id: "workspace-checkout:pending_13",
          },
        },
      }),
      now: new Date("2026-05-28T00:00:00.000Z"),
    });

    expect(upsertWorkspaceSeatEntitlement).toHaveBeenCalledWith({
      workspaceId: 13,
      purchasedSeatCount: 5,
      seatSource: "POLAR",
    });
  });

  it("BASIC 구독이 회수되면 seat entitlement를 0으로 낮춘다", async () => {
    const upsertWorkspaceSeatEntitlement = vi.fn().mockResolvedValue(undefined);
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId: vi.fn().mockResolvedValue(null),
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 14,
        planCode: "BASIC",
        billingCustomerExternalRef: "workspace-checkout:pending_14",
        billingOwnerUserId: 22,
      }),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent: vi.fn().mockResolvedValue({ id: 52 }),
      upsertWorkspaceBillingState: vi.fn().mockResolvedValue(undefined),
      upsertWorkspaceSeatEntitlement,
      updateWorkspaceBillingProjection: vi.fn().mockResolvedValue(undefined),
    } as never);

    await service.handleWebhook({
      providerEventId: "msg_basic_revoked",
      payloadJson: JSON.stringify({
        type: "subscription.revoked",
        timestamp: "2026-05-28T00:00:00.000Z",
        data: {
          id: "sub_basic",
          customer_id: "cus_basic",
          current_period_end: "2026-06-28T00:00:00.000Z",
          cancel_at_period_end: false,
          metadata: {
            targetPlanCode: "BASIC",
            workspaceId: "14",
          },
          customer: {
            external_id: "workspace-checkout:pending_14",
          },
        },
      }),
      now: new Date("2026-05-28T00:00:00.000Z"),
    });

    expect(upsertWorkspaceSeatEntitlement).toHaveBeenCalledWith({
      workspaceId: 14,
      purchasedSeatCount: 0,
      seatSource: "POLAR",
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
        entitlementSource: "POLAR",
      }),
    );
    expect(updateWorkspaceBillingProjection).toHaveBeenCalledWith({
      workspaceId: 5,
      planCode: "FREE",
      billingCustomerExternalRef: "workspace:5",
      billingOwnerUserId: 8,
    });
  });

  it("customer.state_changed의 기간말 해지가 이미 끝났으면 EXPIRED로 반영한다", async () => {
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 22 });
    const upsertWorkspaceBillingState = vi.fn().mockResolvedValue(undefined);
    const updateWorkspaceBillingProjection = vi.fn().mockResolvedValue(undefined);
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId: vi.fn().mockResolvedValue(null),
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 6,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:6",
        billingOwnerUserId: 10,
      }),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    } as never);

    await service.handleWebhook({
      providerEventId: "msg_state_expired",
      payloadJson: JSON.stringify({
        type: "customer.state_changed",
        timestamp: "2026-04-21T00:00:00.000Z",
        data: {
          id: "cus_6",
          external_id: "workspace:6",
          active_subscriptions: [
            {
              id: "sub_6",
              current_period_end: "2026-04-20T00:00:00.000Z",
              cancel_at_period_end: true,
            },
          ],
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
        workspaceId: 6,
        billingStatus: "EXPIRED",
        planCode: "FREE",
        entitlementSource: "POLAR",
      }),
    );
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
        entitlementSource: "POLAR",
      }),
    );
  });

  it("subscription.uncanceled를 ACTIVE projection으로 반영한다", async () => {
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 41 });
    const upsertWorkspaceBillingState = vi.fn().mockResolvedValue(undefined);
    const updateWorkspaceBillingProjection = vi.fn().mockResolvedValue(undefined);
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId: vi.fn().mockResolvedValue(null),
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 8,
        planCode: "FREE",
        billingCustomerExternalRef: "workspace:8",
        billingOwnerUserId: 12,
      }),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    } as never);

    await service.handleWebhook({
      providerEventId: "msg_uncanceled",
      payloadJson: JSON.stringify({
        type: "subscription.uncanceled",
        timestamp: "2026-04-21T00:00:00.000Z",
        data: {
          id: "sub_8",
          customer_id: "cus_8",
          current_period_end: "2026-05-21T00:00:00.000Z",
          cancel_at_period_end: false,
          metadata: {
            workspaceId: "8",
          },
          customer: {
            external_id: "workspace:8",
          },
        },
      }),
      now: new Date("2026-04-21T00:00:00.000Z"),
    });

    expect(upsertWorkspaceBillingState).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 8,
        billingStatus: "ACTIVE",
        planCode: "STANDARD",
        entitlementSource: "POLAR",
        cancelAtPeriodEnd: false,
      }),
    );
  });

  it("subscription.updated past_due는 entitlement를 유지한다", async () => {
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 42 });
    const upsertWorkspaceBillingState = vi.fn().mockResolvedValue(undefined);
    const updateWorkspaceBillingProjection = vi.fn().mockResolvedValue(undefined);
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId: vi.fn().mockResolvedValue(null),
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 9,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:9",
        billingOwnerUserId: 13,
      }),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    } as never);

    await service.handleWebhook({
      providerEventId: "msg_past_due",
      payloadJson: JSON.stringify({
        type: "subscription.updated",
        timestamp: "2026-04-21T00:00:00.000Z",
        data: {
          id: "sub_9",
          customer_id: "cus_9",
          status: "past_due",
          current_period_end: "2026-05-21T00:00:00.000Z",
          cancel_at_period_end: false,
          metadata: {
            workspaceId: "9",
          },
          customer: {
            external_id: "workspace:9",
          },
        },
      }),
      now: new Date("2026-04-21T00:00:00.000Z"),
    });

    expect(upsertWorkspaceBillingState).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 9,
        billingStatus: "ACTIVE",
        planCode: "STANDARD",
        entitlementSource: "POLAR",
      }),
    );
  });

  it("기간말 만료로 온 subscription.revoked는 위험 신호로 집계하지 않는다", async () => {
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 43 });
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId: vi.fn().mockResolvedValue(null),
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 10,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:10",
        billingOwnerUserId: 14,
      }),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent,
      upsertWorkspaceBillingState: vi.fn().mockResolvedValue(undefined),
      updateWorkspaceBillingProjection: vi.fn().mockResolvedValue(undefined),
    } as never);

    await service.handleWebhook({
      providerEventId: "msg_revoked_period_end",
      payloadJson: JSON.stringify({
        type: "subscription.revoked",
        timestamp: "2026-04-21T00:00:00.000Z",
        data: {
          id: "sub_10",
          customer_id: "cus_10",
          current_period_end: "2026-04-20T00:00:00.000Z",
          cancel_at_period_end: true,
          metadata: {
            workspaceId: "10",
          },
          customer: {
            external_id: "workspace:10",
          },
        },
      }),
      now: new Date("2026-04-21T00:00:00.000Z"),
    });

    expect(appendBillingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "subscription.revoked",
        failureReason: null,
      }),
    );
  });

  it("즉시 효력 상실 subscription.revoked는 위험 신호로 표시한다", async () => {
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 44 });
    const service = new PolarWebhookService({
      findBillingEventByProviderEventId: vi.fn().mockResolvedValue(null),
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 11,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:11",
        billingOwnerUserId: 15,
      }),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent,
      upsertWorkspaceBillingState: vi.fn().mockResolvedValue(undefined),
      updateWorkspaceBillingProjection: vi.fn().mockResolvedValue(undefined),
    } as never);

    await service.handleWebhook({
      providerEventId: "msg_revoked_immediate",
      payloadJson: JSON.stringify({
        type: "subscription.revoked",
        timestamp: "2026-04-21T00:00:00.000Z",
        data: {
          id: "sub_11",
          customer_id: "cus_11",
          current_period_end: "2026-05-21T00:00:00.000Z",
          cancel_at_period_end: false,
          metadata: {
            workspaceId: "11",
          },
          customer: {
            external_id: "workspace:11",
          },
        },
      }),
      now: new Date("2026-04-21T00:00:00.000Z"),
    });

    expect(appendBillingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "subscription.revoked",
        failureReason: "RISK_REVIEW_SIGNAL",
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
