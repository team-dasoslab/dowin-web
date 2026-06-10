import { describe, expect, it, vi } from "vitest";
import { PolarWebhookService } from "./polar-webhook.service";

function createBillingStorageMock(
  overrides: Record<string, unknown> = {},
): never {
  type AsyncMock<T = unknown> = (input: T) => Promise<unknown>;
  type WebhookRecordInput = {
    event: {
      workspaceId: number;
    };
    retention: Record<string, unknown>;
    projection?: {
      billingStatus: string;
      planCode: string;
      entitlementSource: string | null;
      customerKey: string | null;
      subscriptionKey: string | null;
      currentPeriodEnd: Date | null;
      cancelAtPeriodEnd: boolean;
      billingOwnerUserId: number | null;
      lastEventOccurredAt: Date;
      purchasedSeatCount?: number | null;
      workspaceBillingCustomerExternalRef: string | null;
      workspaceBillingOwnerUserId: number | null;
    };
  };
  const appendBillingEvent =
    (overrides.appendBillingEvent as AsyncMock | undefined) ??
    vi.fn().mockResolvedValue({ id: 1 });
  const appendBillingRetentionRecord =
    (overrides.appendBillingRetentionRecord as AsyncMock | undefined) ??
    vi.fn().mockResolvedValue(null);
  const upsertWorkspaceBillingState =
    (overrides.upsertWorkspaceBillingState as AsyncMock | undefined) ??
    vi.fn().mockResolvedValue(undefined);
  const upsertWorkspaceSeatEntitlement =
    (overrides.upsertWorkspaceSeatEntitlement as AsyncMock | undefined) ??
    vi.fn().mockResolvedValue(undefined);
  const updateWorkspaceBillingProjection =
    (overrides.updateWorkspaceBillingProjection as AsyncMock | undefined) ??
    vi.fn().mockResolvedValue(undefined);

  const recordPolarWebhookBillingEvent =
    (overrides.recordPolarWebhookBillingEvent as
      | AsyncMock<WebhookRecordInput>
      | undefined) ??
    vi.fn().mockImplementation(async (input: WebhookRecordInput) => {
      const event = (await appendBillingEvent(input.event)) as { id: number };
      await appendBillingRetentionRecord({
        ...input.retention,
        billingEventId: event.id,
      });

      if (input.projection) {
        await upsertWorkspaceBillingState({
          workspaceId: input.event.workspaceId,
          billingStatus: input.projection.billingStatus,
          planCode: input.projection.planCode,
          entitlementSource: input.projection.entitlementSource,
          customerKey: input.projection.customerKey,
          subscriptionKey: input.projection.subscriptionKey,
          currentPeriodEnd: input.projection.currentPeriodEnd,
          cancelAtPeriodEnd: input.projection.cancelAtPeriodEnd,
          billingOwnerUserId: input.projection.billingOwnerUserId,
          lastEventId: event.id,
          lastEventOccurredAt: input.projection.lastEventOccurredAt,
        });

        if (input.projection.purchasedSeatCount !== undefined) {
          await upsertWorkspaceSeatEntitlement({
            workspaceId: input.event.workspaceId,
            purchasedSeatCount: input.projection.purchasedSeatCount ?? 0,
            seatSource: "POLAR",
          });
        }

        await updateWorkspaceBillingProjection({
          workspaceId: input.event.workspaceId,
          planCode: input.projection.planCode,
          billingCustomerExternalRef:
            input.projection.workspaceBillingCustomerExternalRef,
          billingOwnerUserId: input.projection.workspaceBillingOwnerUserId,
        });
      }

      return event;
    });

  const storage = {
    findBillingEventByProviderEventId: vi.fn().mockResolvedValue(null),
    findWorkspaceById: vi.fn(),
    findWorkspaceByCustomerExternalRef: vi.fn(),
    appendBillingEvent,
    appendBillingRetentionRecord,
    upsertWorkspaceBillingState,
    upsertWorkspaceSeatEntitlement,
    updateWorkspaceBillingProjection,
    recordPolarWebhookBillingEvent,
    ...overrides,
  };

  return storage as never;
}

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
    const service = new PolarWebhookService(createBillingStorageMock({
      findBillingEventByProviderEventId,
      findWorkspaceById,
      findWorkspaceByCustomerExternalRef,
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    }));

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
            targetPlanCode: "STANDARD",
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
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 13,
        planCode: "BASIC",
        billingCustomerExternalRef: "workspace-checkout:pending_13",
        billingOwnerUserId: 21,
      }),
      appendBillingEvent: vi.fn().mockResolvedValue({ id: 51 }),
      upsertWorkspaceSeatEntitlement,
    }));

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
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 14,
        planCode: "BASIC",
        billingCustomerExternalRef: "workspace-checkout:pending_14",
        billingOwnerUserId: 22,
      }),
      appendBillingEvent: vi.fn().mockResolvedValue({ id: 52 }),
      upsertWorkspaceSeatEntitlement,
    }));

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
    const service = new PolarWebhookService(createBillingStorageMock({
      findBillingEventByProviderEventId: vi.fn().mockResolvedValue({ id: 1 }),
      findWorkspaceById: vi.fn(),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent: vi.fn(),
      upsertWorkspaceBillingState: vi.fn(),
      updateWorkspaceBillingProjection: vi.fn(),
    }));

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

  it("transaction 내부 중복으로 event가 생성되지 않으면 ignored로 처리한다", async () => {
    const recordPolarWebhookBillingEvent = vi.fn().mockResolvedValue(null);
    const upsertWorkspaceBillingState = vi.fn();
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 3,
        planCode: "BASIC",
        billingCustomerExternalRef: null,
        billingOwnerUserId: 9,
      }),
      recordPolarWebhookBillingEvent,
      upsertWorkspaceBillingState,
    }));

    const result = await service.handleWebhook({
      providerEventId: "msg_race_duplicate",
      payloadJson: JSON.stringify({
        type: "subscription.active",
        timestamp: "2026-06-09T00:00:00.000Z",
        data: {
          id: "sub_1",
          customer_id: "cus_1",
          current_period_end: "2026-07-09T00:00:00.000Z",
          metadata: {
            workspaceId: "3",
            targetPlanCode: "BASIC",
          },
        },
      }),
      now: new Date("2026-06-09T00:00:00.000Z"),
    });

    expect(result).toEqual({ status: "ignored" });
    expect(recordPolarWebhookBillingEvent).toHaveBeenCalledOnce();
    expect(upsertWorkspaceBillingState).not.toHaveBeenCalled();
  });

  it("billing event에는 webhook 원문 대신 normalized payload만 저장한다", async () => {
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 12 });
    const appendBillingRetentionRecord = vi.fn().mockResolvedValue(null);
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 3,
        uid: "ws_3",
        name: "Ops",
        planCode: "BASIC",
        billingCustomerExternalRef: null,
        billingOwnerUserId: 9,
      }),
      appendBillingEvent,
      appendBillingRetentionRecord,
    }));

    await service.handleWebhook({
      providerEventId: "msg_sanitized",
      payloadJson: JSON.stringify({
        type: "subscription.active",
        timestamp: "2026-06-09T00:00:00.000Z",
        data: {
          id: "sub_1",
          customer_id: "cus_1",
          current_period_end: "2026-07-09T00:00:00.000Z",
          seats: 5,
          metadata: {
            workspaceId: "3",
            targetPlanCode: "BASIC",
            requestedSeatCount: "5",
            internalNote: "drop me",
          },
          customer: {
            external_id: "workspace:3",
            email: "buyer@example.com",
          },
          payment_method_details: {
            card: {
              number: "4242424242424242",
              cvc: "123",
            },
          },
        },
      }),
      now: new Date("2026-06-09T00:00:00.000Z"),
    });

    const payloadJson = appendBillingEvent.mock.calls[0]?.[0]?.payloadJson;
    expect(JSON.parse(payloadJson)).toEqual({
      type: "subscription.active",
      timestamp: "2026-06-09T00:00:00.000Z",
      data: {
        id: "sub_1",
        customer_id: "cus_1",
        current_period_end: "2026-07-09T00:00:00.000Z",
        seats: 5,
        metadata: {
          workspaceId: "3",
          targetPlanCode: "BASIC",
          requestedSeatCount: "5",
        },
        customer: {
          external_id: "workspace:3",
        },
      },
    });
    expect(payloadJson).not.toContain("4242424242424242");
    expect(payloadJson).not.toContain("cvc");
    expect(payloadJson).not.toContain("buyer@example.com");
    expect(payloadJson).not.toContain("internalNote");
    expect(appendBillingRetentionRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        billingEventId: 12,
        providerEventId: "msg_sanitized",
        eventType: "subscription.active",
        eventOccurredAt: new Date("2026-06-09T00:00:00.000Z"),
        workspaceIdSnapshot: 3,
        workspaceUidSnapshot: "ws_3",
        workspaceNameSnapshot: "Ops",
        billingOwnerUserIdSnapshot: 9,
        planCode: "BASIC",
        seatCount: 5,
        customerKey: "cus_1",
        subscriptionKey: "sub_1",
        normalizedPayloadJson: payloadJson,
        legalRetentionUntil: new Date("2036-06-09T00:00:00.000Z"),
      }),
    );
  });

  it("customer.state_changed에 활성 구독이 없으면 FREE로 회수한다", async () => {
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 21 });
    const upsertWorkspaceBillingState = vi.fn().mockResolvedValue(undefined);
    const updateWorkspaceBillingProjection = vi.fn().mockResolvedValue(undefined);
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 5,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:5",
        billingOwnerUserId: 8,
      }),
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    }));

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

  it("customer.state_changed가 구독 metadata의 BASIC 플랜을 반영한다", async () => {
    const findWorkspaceByCustomerExternalRef = vi.fn().mockResolvedValue({
      id: 13,
      planCode: "BASIC",
      billingCustomerExternalRef: "workspace-checkout:pending_13",
      billingOwnerUserId: 21,
    });
    const upsertWorkspaceSeatEntitlement = vi.fn().mockResolvedValue(undefined);
    const upsertWorkspaceBillingState = vi.fn().mockResolvedValue(undefined);
    const updateWorkspaceBillingProjection = vi.fn().mockResolvedValue(undefined);
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 13,
        planCode: "BASIC",
        billingCustomerExternalRef: "workspace-checkout:pending_13",
        billingOwnerUserId: 21,
      }),
      findWorkspaceByCustomerExternalRef,
      appendBillingEvent: vi.fn().mockResolvedValue({ id: 53 }),
      upsertWorkspaceBillingState,
      upsertWorkspaceSeatEntitlement,
      updateWorkspaceBillingProjection,
    }));

    await service.handleWebhook({
      providerEventId: "msg_state_basic",
      payloadJson: JSON.stringify({
        type: "customer.state_changed",
        timestamp: "2026-05-28T00:00:00.000Z",
        data: {
          id: "cus_basic",
          external_id: "workspace-checkout:previous_pending",
          metadata: {},
          active_subscriptions: [
            {
              id: "sub_basic",
              current_period_end: "2026-06-28T00:00:00.000Z",
              cancel_at_period_end: true,
              metadata: {
                targetPlanCode: "BASIC",
                requestedSeatCount: "10",
                requestedByUserId: "21",
                workspaceCheckoutId: "pending_13",
              },
            },
          ],
        },
      }),
      now: new Date("2026-05-28T00:00:00.000Z"),
    });

    expect(findWorkspaceByCustomerExternalRef).toHaveBeenCalledWith(
      "workspace-checkout:pending_13",
    );
    expect(upsertWorkspaceBillingState).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 13,
        billingStatus: "CANCELED",
        planCode: "BASIC",
        billingOwnerUserId: 21,
      }),
    );
    expect(updateWorkspaceBillingProjection).toHaveBeenCalledWith({
      workspaceId: 13,
      planCode: "BASIC",
      billingCustomerExternalRef: "workspace-checkout:pending_13",
      billingOwnerUserId: 21,
    });
    expect(upsertWorkspaceSeatEntitlement).toHaveBeenCalledWith({
      workspaceId: 13,
      purchasedSeatCount: 10,
      seatSource: "POLAR",
    });
  });

  it("customer.state_changed의 기간말 해지가 이미 끝났으면 EXPIRED로 반영한다", async () => {
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 22 });
    const upsertWorkspaceBillingState = vi.fn().mockResolvedValue(undefined);
    const updateWorkspaceBillingProjection = vi.fn().mockResolvedValue(undefined);
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 6,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:6",
        billingOwnerUserId: 10,
      }),
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    }));

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
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 7,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:7",
        billingOwnerUserId: 4,
      }),
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    }));

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
            targetPlanCode: "STANDARD",
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
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 8,
        planCode: "FREE",
        billingCustomerExternalRef: "workspace:8",
        billingOwnerUserId: 12,
      }),
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    }));

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
            targetPlanCode: "STANDARD",
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
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 9,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:9",
        billingOwnerUserId: 13,
      }),
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection,
    }));

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
            targetPlanCode: "STANDARD",
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
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 10,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:10",
        billingOwnerUserId: 14,
      }),
      appendBillingEvent,
      upsertWorkspaceBillingState: vi.fn().mockResolvedValue(undefined),
      updateWorkspaceBillingProjection: vi.fn().mockResolvedValue(undefined),
    }));

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
            targetPlanCode: "STANDARD",
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
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 11,
        planCode: "STANDARD",
        billingCustomerExternalRef: "workspace:11",
        billingOwnerUserId: 15,
      }),
      appendBillingEvent,
      upsertWorkspaceBillingState: vi.fn().mockResolvedValue(undefined),
      updateWorkspaceBillingProjection: vi.fn().mockResolvedValue(undefined),
    }));

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
            targetPlanCode: "STANDARD",
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

  it("부분 환불 order.refunded도 권한 회수 없이 위험 이벤트로 저장한다", async () => {
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 45 });
    const upsertWorkspaceBillingState = vi.fn();
    const service = new PolarWebhookService(createBillingStorageMock({
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 12,
        planCode: "BASIC",
        billingCustomerExternalRef: "workspace:12",
        billingOwnerUserId: 16,
      }),
      appendBillingEvent,
      upsertWorkspaceBillingState,
      updateWorkspaceBillingProjection: vi.fn(),
    }));

    await service.handleWebhook({
      providerEventId: "msg_partial_refund",
      payloadJson: JSON.stringify({
        type: "order.refunded",
        timestamp: "2026-04-21T00:00:00.000Z",
        data: {
          id: "ord_12",
          customer_id: "cus_12",
          subscription_id: "sub_12",
          refunded_amount: 1000,
          total_amount: 29000,
          metadata: {
            workspaceId: "12",
          },
          customer: {
            external_id: "workspace:12",
          },
        },
      }),
      now: new Date("2026-04-21T00:00:00.000Z"),
    });

    expect(appendBillingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "order.refunded",
        status: "ACCEPTED",
        failureReason: "PARTIAL_REFUND_RISK_SIGNAL",
      }),
    );
    expect(upsertWorkspaceBillingState).not.toHaveBeenCalled();
  });

  it("signed payload가 JSON이 아니면 무시한다", async () => {
    const service = new PolarWebhookService(createBillingStorageMock({
      findBillingEventByProviderEventId: vi.fn(),
      findWorkspaceById: vi.fn(),
      findWorkspaceByCustomerExternalRef: vi.fn(),
      appendBillingEvent: vi.fn(),
      upsertWorkspaceBillingState: vi.fn(),
      updateWorkspaceBillingProjection: vi.fn(),
    }));

    const result = await service.handleWebhook({
      providerEventId: "msg_bad_json",
      payloadJson: "{not-json",
    });

    expect(result).toEqual({ status: "ignored" });
  });
});
