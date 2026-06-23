import { describe, expect, it, vi } from "vitest";
import { AdminBillingService } from "./admin-billing.service";

describe("AdminBillingService", () => {
  it("운영자가 Polar product 매핑을 upsert하면 audit log를 남긴다", async () => {
    const upsertProviderProduct = vi.fn().mockResolvedValue({
      id: 9,
      provider: "POLAR",
      environment: "production",
      planCode: "BASIC",
      providerProductId: "prod_basic_live",
      isActive: true,
      createdAt: new Date("2026-05-28T00:00:00.000Z"),
      updatedAt: new Date("2026-05-28T00:00:00.000Z"),
    });
    const createAuditLog = vi.fn().mockResolvedValue(undefined);
    const service = new AdminBillingService(
      {
        listProviderProducts: vi.fn(),
        upsertProviderProduct,
        searchAdminBillingWorkspaces: vi.fn(),
        findWorkspaceBillingAdminDetail: vi.fn(),
        listBillingEventsForWorkspace: vi.fn(),
        getRecentBillingRiskSummaries: vi.fn(),
        appendBillingEvent: vi.fn(),
        upsertWorkspaceBillingState: vi.fn(),
        upsertWorkspaceSeatEntitlement: vi.fn(),
        updateWorkspaceBillingProjection: vi.fn(),
        countWorkspaceMembers: vi.fn(),
      } as never,
      { create: createAuditLog },
    );

    const result = await service.upsertProviderProduct(1, {
      provider: "POLAR",
      environment: "production",
      planCode: "BASIC",
      providerProductId: "prod_basic_live",
      isActive: true,
      changeReason: "Basic product ID 등록",
    });

    expect(upsertProviderProduct).toHaveBeenCalledWith({
      provider: "POLAR",
      environment: "production",
      planCode: "BASIC",
      providerProductId: "prod_basic_live",
      isActive: true,
    });
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: "ADMIN",
        actorAdminUserId: 1,
        entityType: "BILLING_PROVIDER_PRODUCT",
        entityId: 9,
        actionType: "UPDATE",
      }),
    );
    expect(result).toEqual({
      id: 9,
      provider: "POLAR",
      environment: "production",
      planCode: "BASIC",
      providerProductId: "prod_basic_live",
      isActive: true,
      createdAt: "2026-05-28T00:00:00.000Z",
      updatedAt: "2026-05-28T00:00:00.000Z",
    });
  });

  it("운영용 billing 목록 조회 시 위험 신호 요약을 합쳐서 반환한다", async () => {
    const service = new AdminBillingService(
      {
        listProviderProducts: vi.fn(),
        upsertProviderProduct: vi.fn(),
        searchAdminBillingWorkspaces: vi.fn().mockResolvedValue([
          {
            workspaceId: 3,
            workspaceName: "Dowin",
            planCode: "STANDARD",
            billingStatus: "ACTIVE",
            entitlementSource: "POLAR",
            provider: "POLAR",
            currentPeriodEnd: new Date("2026-05-31T00:00:00.000Z"),
            cancelAtPeriodEnd: false,
            billingOwnerUserId: 7,
            customerKey: "cus_123",
            subscriptionKey: "sub_123",
            billingCustomerExternalRef: "workspace:3",
            lastEventOccurredAt: new Date("2026-05-01T00:00:00.000Z"),
            updatedAt: new Date("2026-05-01T00:00:00.000Z"),
          },
        ]),
        findWorkspaceBillingAdminDetail: vi.fn(),
        listBillingEventsForWorkspace: vi.fn(),
        getRecentBillingRiskSummaries: vi
          .fn()
          .mockResolvedValue(
            new Map([[3, { recentRefundCount: 1, recentRevokedCount: 1 }]]),
          ),
        appendBillingEvent: vi.fn(),
        upsertWorkspaceBillingState: vi.fn(),
        upsertWorkspaceSeatEntitlement: vi.fn(),
        updateWorkspaceBillingProjection: vi.fn(),
        countWorkspaceMembers: vi.fn(),
      } as never,
      { create: vi.fn() },
    );

    const result = await service.listWorkspaces({ workspaceName: "Dowin" });

    expect(result).toEqual([
      expect.objectContaining({
        workspaceId: 3,
        recentRefundCount: 1,
        recentRevokedCount: 1,
        requiresManualReview: true,
      }),
    ]);
  });

  it("운영자 수동 보정 시 manual correction event와 audit log를 남긴다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T12:00:00.000Z"));

    const findWorkspaceBillingAdminDetail = vi
      .fn()
      .mockResolvedValueOnce({
        workspaceId: 3,
        workspaceName: "Dowin",
        planCode: "FREE",
        billingStatus: "NONE",
        entitlementSource: null,
        provider: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        billingOwnerUserId: null,
        customerKey: null,
        subscriptionKey: null,
        billingCustomerExternalRef: "workspace:3",
        lastEventOccurredAt: null,
        updatedAt: null,
      })
      .mockResolvedValueOnce({
        workspaceId: 3,
        workspaceName: "Dowin",
        planCode: "STANDARD",
        billingStatus: "ACTIVE",
        entitlementSource: "MANUAL_GRANT",
        provider: null,
        currentPeriodEnd: new Date("2026-05-31T00:00:00.000Z"),
        cancelAtPeriodEnd: false,
        billingOwnerUserId: 9,
        customerKey: "cus_123",
        subscriptionKey: "sub_123",
        billingCustomerExternalRef: "workspace:3",
        lastEventOccurredAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      });
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 77 });
    const upsertWorkspaceBillingState = vi.fn().mockResolvedValue(undefined);
    const upsertWorkspaceSeatEntitlement = vi.fn().mockResolvedValue(undefined);
    const updateWorkspaceBillingProjection = vi.fn().mockResolvedValue(undefined);
    const createAuditLog = vi.fn().mockResolvedValue(undefined);
    const service = new AdminBillingService(
      {
        listProviderProducts: vi.fn(),
        upsertProviderProduct: vi.fn(),
        searchAdminBillingWorkspaces: vi.fn(),
        findWorkspaceBillingAdminDetail,
        listBillingEventsForWorkspace: vi.fn().mockResolvedValue([
          {
            id: 77,
            provider: "POLAR",
            providerEventId: null,
            eventType: "admin.manual_override",
            subscriptionKey: "sub_123",
            customerKey: "cus_123",
            occurredAt: new Date("2026-05-01T12:00:00.000Z"),
            recordedAt: new Date("2026-05-01T12:00:00.000Z"),
            status: "ACCEPTED",
            failureReason: null,
            source: "MANUAL_CORRECTION",
          },
        ]),
        getRecentBillingRiskSummaries: vi.fn().mockResolvedValue(new Map()),
        appendBillingEvent,
        upsertWorkspaceBillingState,
        upsertWorkspaceSeatEntitlement,
        updateWorkspaceBillingProjection,
        countWorkspaceMembers: vi.fn().mockResolvedValue(2),
      } as never,
      { create: createAuditLog },
    );

    const result = await service.applyManualOverride(1, 3, {
      planCode: "STANDARD",
      billingStatus: "ACTIVE",
      entitlementSource: "MANUAL_GRANT",
      customerKey: "cus_123",
      subscriptionKey: "sub_123",
      currentPeriodEnd: "2026-05-31T00:00:00.000Z",
      billingOwnerUserId: 9,
      changeReason: "웹훅 누락 수동 보정",
    });

    expect(appendBillingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 3,
        eventType: "admin.manual_override",
        source: "MANUAL_CORRECTION",
      }),
    );
    expect(upsertWorkspaceBillingState).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 3,
        planCode: "STANDARD",
        billingStatus: "ACTIVE",
        entitlementSource: "MANUAL_GRANT",
      }),
    );
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: "ADMIN",
        actorAdminUserId: 1,
        workspaceId: 3,
        entityType: "WORKSPACE",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        workspaceId: 3,
        planCode: "STANDARD",
        billingStatus: "ACTIVE",
        entitlementSource: "MANUAL_GRANT",
        events: [
          expect.objectContaining({
            id: 77,
            source: "MANUAL_CORRECTION",
          }),
        ],
      }),
    );
    vi.useRealTimers();
  });

  it("BASIC 수동 보정 시 seat entitlement를 함께 저장한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T12:00:00.000Z"));

    const findWorkspaceBillingAdminDetail = vi
      .fn()
      .mockResolvedValueOnce({
        workspaceId: 3,
        workspaceName: "Dowin",
        planCode: "FREE",
        billingStatus: "NONE",
        entitlementSource: null,
        provider: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        billingOwnerUserId: null,
        customerKey: null,
        subscriptionKey: null,
        billingCustomerExternalRef: "workspace:3",
        lastEventOccurredAt: null,
        updatedAt: null,
        purchasedSeatCount: null,
      })
      .mockResolvedValueOnce({
        workspaceId: 3,
        workspaceName: "Dowin",
        planCode: "BASIC",
        billingStatus: "ACTIVE",
        entitlementSource: "MANUAL_GRANT",
        provider: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        billingOwnerUserId: null,
        customerKey: null,
        subscriptionKey: null,
        billingCustomerExternalRef: "workspace:3",
        lastEventOccurredAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        purchasedSeatCount: 5,
      });
    const upsertWorkspaceSeatEntitlement = vi.fn().mockResolvedValue(undefined);
    const service = new AdminBillingService(
      {
        listProviderProducts: vi.fn(),
        upsertProviderProduct: vi.fn(),
        searchAdminBillingWorkspaces: vi.fn(),
        findWorkspaceBillingAdminDetail,
        listBillingEventsForWorkspace: vi.fn().mockResolvedValue([]),
        getRecentBillingRiskSummaries: vi.fn().mockResolvedValue(new Map()),
        appendBillingEvent: vi.fn().mockResolvedValue({ id: 77 }),
        upsertWorkspaceBillingState: vi.fn(),
        upsertWorkspaceSeatEntitlement,
        updateWorkspaceBillingProjection: vi.fn(),
        countWorkspaceMembers: vi.fn().mockResolvedValue(2),
      } as never,
      { create: vi.fn() },
    );

    await service.applyManualOverride(1, 3, {
      planCode: "BASIC",
      billingStatus: "ACTIVE",
      entitlementSource: "MANUAL_GRANT",
      purchasedSeatCount: 5,
      changeReason: "수동 Basic 지급",
    });

    expect(upsertWorkspaceSeatEntitlement).toHaveBeenCalledWith({
      workspaceId: 3,
      purchasedSeatCount: 5,
      seatSource: "MANUAL_GRANT",
    });
    vi.useRealTimers();
  });

  it("과거 종료일로 수동 Basic 권한을 저장하면 즉시 만료 상태로 보정한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-23T12:00:00.000Z"));

    const findWorkspaceBillingAdminDetail = vi
      .fn()
      .mockResolvedValueOnce({
        workspaceId: 3,
        workspaceName: "Dowin",
        planCode: "BASIC",
        billingStatus: "ACTIVE",
        entitlementSource: "MANUAL_GRANT",
        provider: null,
        currentPeriodEnd: new Date("2026-07-01T00:00:00.000Z"),
        cancelAtPeriodEnd: false,
        billingOwnerUserId: null,
        customerKey: null,
        subscriptionKey: null,
        billingCustomerExternalRef: "workspace:3",
        lastEventOccurredAt: null,
        updatedAt: null,
        purchasedSeatCount: 5,
      })
      .mockResolvedValueOnce({
        workspaceId: 3,
        workspaceName: "Dowin",
        planCode: "FREE",
        billingStatus: "EXPIRED",
        entitlementSource: "MANUAL_GRANT",
        provider: null,
        currentPeriodEnd: new Date("2026-06-22T00:00:00.000Z"),
        cancelAtPeriodEnd: false,
        billingOwnerUserId: null,
        customerKey: null,
        subscriptionKey: null,
        billingCustomerExternalRef: "workspace:3",
        lastEventOccurredAt: new Date("2026-06-23T12:00:00.000Z"),
        updatedAt: new Date("2026-06-23T12:00:00.000Z"),
        purchasedSeatCount: 5,
      });
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 77 });
    const upsertWorkspaceBillingState = vi.fn();
    const upsertWorkspaceSeatEntitlement = vi.fn();
    const updateWorkspaceBillingProjection = vi.fn();
    const createAuditLog = vi.fn();
    const service = new AdminBillingService(
      {
        listProviderProducts: vi.fn(),
        upsertProviderProduct: vi.fn(),
        searchAdminBillingWorkspaces: vi.fn(),
        findWorkspaceBillingAdminDetail,
        listBillingEventsForWorkspace: vi.fn().mockResolvedValue([]),
        getRecentBillingRiskSummaries: vi.fn().mockResolvedValue(new Map()),
        appendBillingEvent,
        upsertWorkspaceBillingState,
        upsertWorkspaceSeatEntitlement,
        updateWorkspaceBillingProjection,
        countWorkspaceMembers: vi.fn(),
      } as never,
      { create: createAuditLog },
    );

    const result = await service.applyManualOverride(1, 3, {
      planCode: "BASIC",
      billingStatus: "ACTIVE",
      entitlementSource: "MANUAL_GRANT",
      currentPeriodEnd: "2026-06-22T00:00:00.000Z",
      purchasedSeatCount: 5,
      changeReason: "과거 종료일로 수동 권한 종료",
    });

    expect(upsertWorkspaceBillingState).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 3,
        planCode: "FREE",
        billingStatus: "EXPIRED",
        entitlementSource: "MANUAL_GRANT",
      }),
    );
    expect(updateWorkspaceBillingProjection).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 3,
        planCode: "FREE",
      }),
    );
    expect(upsertWorkspaceSeatEntitlement).not.toHaveBeenCalled();
    expect(appendBillingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        payloadJson: expect.stringContaining('"expiredImmediately":true'),
      }),
    );
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.stringContaining('"expiredImmediately":true'),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        planCode: "FREE",
        billingStatus: "EXPIRED",
        entitlementSource: "MANUAL_GRANT",
      }),
    );
    vi.useRealTimers();
  });

  it("전체 sync는 과거 종료일의 수동 권한을 만료 상태로 보정한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-23T12:00:00.000Z"));

    const searchAdminBillingWorkspaces = vi.fn().mockResolvedValue([
      {
        workspaceId: 3,
        workspaceName: "Dowin",
        planCode: "BASIC",
        billingStatus: "ACTIVE",
        entitlementSource: "MANUAL_GRANT",
        provider: null,
        currentPeriodEnd: new Date("2026-06-22T00:00:00.000Z"),
        cancelAtPeriodEnd: false,
        billingOwnerUserId: null,
        customerKey: null,
        subscriptionKey: null,
        billingCustomerExternalRef: "workspace:3",
        lastEventOccurredAt: null,
        updatedAt: null,
        purchasedSeatCount: 5,
      },
      {
        workspaceId: 4,
        workspaceName: "Future",
        planCode: "BASIC",
        billingStatus: "ACTIVE",
        entitlementSource: "MANUAL_GRANT",
        provider: null,
        currentPeriodEnd: new Date("2026-07-01T00:00:00.000Z"),
        cancelAtPeriodEnd: false,
        billingOwnerUserId: null,
        customerKey: null,
        subscriptionKey: null,
        billingCustomerExternalRef: "workspace:4",
        lastEventOccurredAt: null,
        updatedAt: null,
        purchasedSeatCount: 5,
      },
    ]);
    const findWorkspaceBillingAdminDetail = vi
      .fn()
      .mockResolvedValueOnce({
        workspaceId: 3,
        workspaceName: "Dowin",
        planCode: "BASIC",
        billingStatus: "ACTIVE",
        entitlementSource: "MANUAL_GRANT",
        provider: null,
        currentPeriodEnd: new Date("2026-06-22T00:00:00.000Z"),
        cancelAtPeriodEnd: false,
        billingOwnerUserId: null,
        customerKey: null,
        subscriptionKey: null,
        billingCustomerExternalRef: "workspace:3",
        lastEventOccurredAt: null,
        updatedAt: null,
        purchasedSeatCount: 5,
      })
      .mockResolvedValueOnce({
        workspaceId: 3,
        workspaceName: "Dowin",
        planCode: "FREE",
        billingStatus: "EXPIRED",
        entitlementSource: "MANUAL_GRANT",
        provider: null,
        currentPeriodEnd: new Date("2026-06-22T00:00:00.000Z"),
        cancelAtPeriodEnd: false,
        billingOwnerUserId: null,
        customerKey: null,
        subscriptionKey: null,
        billingCustomerExternalRef: "workspace:3",
        lastEventOccurredAt: new Date("2026-06-23T12:00:00.000Z"),
        updatedAt: new Date("2026-06-23T12:00:00.000Z"),
        purchasedSeatCount: 5,
      });
    const appendBillingEvent = vi.fn().mockResolvedValue({ id: 77 });
    const upsertWorkspaceBillingState = vi.fn();
    const updateWorkspaceBillingProjection = vi.fn();
    const createAuditLog = vi.fn();
    const service = new AdminBillingService(
      {
        listProviderProducts: vi.fn(),
        upsertProviderProduct: vi.fn(),
        searchAdminBillingWorkspaces,
        findWorkspaceBillingAdminDetail,
        listBillingEventsForWorkspace: vi.fn().mockResolvedValue([]),
        getRecentBillingRiskSummaries: vi.fn().mockResolvedValue(new Map()),
        appendBillingEvent,
        upsertWorkspaceBillingState,
        upsertWorkspaceSeatEntitlement: vi.fn(),
        updateWorkspaceBillingProjection,
        countWorkspaceMembers: vi.fn(),
      } as never,
      { create: createAuditLog },
    );

    const result = await service.syncAllWorkspaceBillingStatuses(1);

    expect(appendBillingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin.billing_status_sync",
        source: "MANUAL_CORRECTION",
      }),
    );
    expect(upsertWorkspaceBillingState).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 3,
        planCode: "FREE",
        billingStatus: "EXPIRED",
        entitlementSource: "MANUAL_GRANT",
      }),
    );
    expect(updateWorkspaceBillingProjection).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 3,
        planCode: "FREE",
      }),
    );
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorAdminUserId: 1,
        actionType: "UPDATE",
      }),
    );
    expect(result).toEqual({ syncedCount: 1, workspaceIds: [3] });
    vi.useRealTimers();
  });

  it("전체 sync는 이미 현재 상태와 맞는 워크스페이스에 이벤트를 남기지 않는다", async () => {
    const findWorkspaceBillingAdminDetail = vi.fn();
    const appendBillingEvent = vi.fn();
    const service = new AdminBillingService(
      {
        listProviderProducts: vi.fn(),
        upsertProviderProduct: vi.fn(),
        searchAdminBillingWorkspaces: vi.fn().mockResolvedValue([
          {
            workspaceId: 3,
            workspaceName: "Dowin",
            planCode: "BASIC",
            billingStatus: "ACTIVE",
            entitlementSource: "MANUAL_GRANT",
            provider: null,
            currentPeriodEnd: new Date("2026-07-01T00:00:00.000Z"),
            cancelAtPeriodEnd: false,
            billingOwnerUserId: null,
            customerKey: null,
            subscriptionKey: null,
            billingCustomerExternalRef: "workspace:3",
            lastEventOccurredAt: null,
            updatedAt: null,
            purchasedSeatCount: 5,
          },
        ]),
        findWorkspaceBillingAdminDetail,
        listBillingEventsForWorkspace: vi.fn().mockResolvedValue([]),
        getRecentBillingRiskSummaries: vi.fn().mockResolvedValue(new Map()),
        appendBillingEvent,
        upsertWorkspaceBillingState: vi.fn(),
        upsertWorkspaceSeatEntitlement: vi.fn(),
        updateWorkspaceBillingProjection: vi.fn(),
        countWorkspaceMembers: vi.fn(),
      } as never,
      { create: vi.fn() },
    );

    const result = await service.syncAllWorkspaceBillingStatuses(1);

    expect(result).toEqual({ syncedCount: 0, workspaceIds: [] });
    expect(appendBillingEvent).not.toHaveBeenCalled();
    expect(findWorkspaceBillingAdminDetail).not.toHaveBeenCalled();
  });

  it("BASIC 수동 보정 seat가 현재 멤버 수보다 작으면 현재 멤버 수로 보정한다", async () => {
    const upsertWorkspaceSeatEntitlement = vi.fn().mockResolvedValue(undefined);
    const service = new AdminBillingService(
      {
        listProviderProducts: vi.fn(),
        upsertProviderProduct: vi.fn(),
        searchAdminBillingWorkspaces: vi.fn(),
        findWorkspaceBillingAdminDetail: vi
          .fn()
          .mockResolvedValueOnce({
            workspaceId: 3,
            workspaceName: "Dowin",
            planCode: "FREE",
            billingStatus: "NONE",
            entitlementSource: null,
            provider: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            billingOwnerUserId: null,
            customerKey: null,
            subscriptionKey: null,
            billingCustomerExternalRef: "workspace:3",
            lastEventOccurredAt: null,
            updatedAt: null,
            purchasedSeatCount: null,
          })
          .mockResolvedValueOnce({
            workspaceId: 3,
            workspaceName: "Dowin",
            planCode: "BASIC",
            billingStatus: "ACTIVE",
            entitlementSource: "MANUAL_GRANT",
            provider: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            billingOwnerUserId: null,
            customerKey: null,
            subscriptionKey: null,
            billingCustomerExternalRef: "workspace:3",
            lastEventOccurredAt: null,
            updatedAt: null,
            purchasedSeatCount: 4,
          }),
        listBillingEventsForWorkspace: vi.fn().mockResolvedValue([]),
        getRecentBillingRiskSummaries: vi.fn().mockResolvedValue(new Map()),
        appendBillingEvent: vi.fn().mockResolvedValue({ id: 77 }),
        upsertWorkspaceBillingState: vi.fn(),
        upsertWorkspaceSeatEntitlement,
        updateWorkspaceBillingProjection: vi.fn(),
        countWorkspaceMembers: vi.fn().mockResolvedValue(4),
      } as never,
      { create: vi.fn() },
    );

    await service.applyManualOverride(1, 3, {
      planCode: "BASIC",
      billingStatus: "ACTIVE",
      entitlementSource: "MANUAL_GRANT",
      purchasedSeatCount: 1,
      changeReason: "수동 Basic 지급",
    });

    expect(upsertWorkspaceSeatEntitlement).toHaveBeenCalledWith(
      expect.objectContaining({
        purchasedSeatCount: 4,
      }),
    );
  });
});
