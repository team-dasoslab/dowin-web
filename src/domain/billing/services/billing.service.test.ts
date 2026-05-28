import { ConflictError } from "@/lib/server/errors";
import { describe, expect, it, vi } from "vitest";
import { BillingService } from "./billing.service";

describe("BillingService", () => {
  it("billing state가 없으면 workspace planCode와 NONE 상태를 반환한다", async () => {
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
    );

    await expect(service.getMyBilling("ws_abc", 7)).resolves.toEqual({
      workspaceId: "ws_abc",
      workspaceName: "Dowin",
      planCode: "BASIC",
      billingStatus: "NONE",
      entitlementSource: null,
      provider: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      billingOwnerUserId: null,
      recentRefundCount: 0,
      recentRevokedCount: 0,
      requiresManualReview: false,
      canManageBilling: true,
    });
  });

  it("manual grant 상태에서는 portal을 열 수 없다", async () => {
    const createCustomerSession = vi.fn();
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
          billingCustomerExternalRef: null,
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          entitlementSource: "MANUAL_GRANT",
          customerKey: null,
        }),
        getRecentBillingRiskSummary: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
        getCheckoutSession: vi.fn(),
      },
    );

    await expect(service.getPortalUrl("ws_abc", 7)).rejects.toEqual(
      expect.objectContaining<Partial<ConflictError>>({
        code: "BILLING_NOT_READY",
      }),
    );
    expect(createCustomerSession).not.toHaveBeenCalled();
  });

  it("Polar entitlementSource면 portal session을 생성한다", async () => {
    const createCustomerSession = vi.fn().mockResolvedValue({
      customerPortalUrl: "https://polar.sh/portal",
    });
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
          billingCustomerExternalRef: "workspace:1",
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          entitlementSource: "POLAR",
          customerKey: "cus_123",
        }),
        getRecentBillingRiskSummary: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
        getCheckoutSession: vi.fn(),
      },
    );

    await expect(service.getPortalUrl("ws_abc", 7)).resolves.toBe(
      "https://polar.sh/portal",
    );
    expect(createCustomerSession).toHaveBeenCalledWith({
      customerId: "cus_123",
    });
  });

  it("customerKey가 없으면 external customer id로 portal session을 만든다", async () => {
    const createCustomerSession = vi.fn().mockResolvedValue({
      customerPortalUrl: "https://polar.sh/portal",
    });
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
          billingCustomerExternalRef: "workspace:1",
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
        getCheckoutSession: vi.fn(),
      },
    );

    await expect(service.getPortalUrl("ws_abc", 7)).resolves.toBe(
      "https://polar.sh/portal",
    );
    expect(createCustomerSession).toHaveBeenCalledWith({
      externalCustomerId: "workspace:1",
    });
  });
});
