import { describe, expect, it, vi } from "vitest";
import { AdminBillingService } from "./admin-billing.service";

describe("AdminBillingService", () => {
  it("운영용 billing 목록 조회 시 위험 신호 요약을 합쳐서 반환한다", async () => {
    const service = new AdminBillingService(
      {
        searchAdminBillingWorkspaces: vi.fn().mockResolvedValue([
          {
            workspaceId: 3,
            workspaceName: "Dowin",
            planCode: "STANDARD",
            billingStatus: "ACTIVE",
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
        updateWorkspaceBillingProjection: vi.fn(),
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
        provider: "POLAR",
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
    const updateWorkspaceBillingProjection = vi.fn().mockResolvedValue(undefined);
    const createAuditLog = vi.fn().mockResolvedValue(undefined);
    const service = new AdminBillingService(
      {
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
        updateWorkspaceBillingProjection,
      } as never,
      { create: createAuditLog },
    );

    const result = await service.applyManualOverride(1, 3, {
      planCode: "STANDARD",
      billingStatus: "ACTIVE",
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
});
