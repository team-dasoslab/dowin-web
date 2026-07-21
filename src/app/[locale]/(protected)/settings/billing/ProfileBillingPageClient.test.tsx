import { type BillingStatus } from "@/domain/billing/types";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGetWorkspacesWorkspaceIdBillingMe } from "@/api/generated/billing/billing";
import { useToast } from "@/context/ToastContext";
import { renderWithProviders } from "@/test/render";

import { useProfileBillingActions } from "./_hooks/useProfileBillingActions";
import { useUpdateWorkspaceSeatsMutation } from "./_hooks/useUpdateWorkspaceSeatsMutation";
import { ProfileBillingPageClient } from "./ProfileBillingPageClient";

vi.mock("@/api/generated/billing/billing", () => ({
  useGetWorkspacesWorkspaceIdBillingMe: vi.fn(),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

vi.mock("./_hooks/useProfileBillingActions", () => ({
  useProfileBillingActions: vi.fn(),
}));

vi.mock("./_hooks/useUpdateWorkspaceSeatsMutation", () => ({
  useUpdateWorkspaceSeatsMutation: vi.fn(),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const useParams = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => useParams(),
}));

const showToast = vi.fn();
const handleReturnedFromCheckout = vi.fn();
const openPortal = vi.fn();
const updateSeats = vi.fn();
const refetch = vi.fn();

type BillingOverrides = Partial<{
  billingStatus: BillingStatus;
  canManageBilling: boolean;
  currentPeriodEnd: string | null;
  entitlementSource:
    | "BETA_PROMOTIONAL_GRANT"
    | "INTERNAL_TEST"
    | "MANUAL_GRANT"
    | "PARTNER"
    | "POLAR"
    | null;
  pendingSeatCount: number | null;
  pendingSeatEffectiveAt: string | null;
  purchasedSeatCount: number | null;
  recentRefundCount: number;
  recentRevokedCount: number;
  requiresManualReview: boolean;
  usedSeatCount: number | null;
  workspaceName: string;
}>;

function mockBilling(overrides: BillingOverrides = {}) {
  vi.mocked(useGetWorkspacesWorkspaceIdBillingMe).mockReturnValue({
    data: {
      data: {
        billingStatus: "ACTIVE",
        canManageBilling: true,
        currentPeriodEnd: "2026-07-01T00:00:00.000Z",
        entitlementSource: "POLAR",
        pendingSeatCount: null,
        pendingSeatEffectiveAt: null,
        purchasedSeatCount: 5,
        recentRefundCount: 0,
        recentRevokedCount: 0,
        requiresManualReview: false,
        usedSeatCount: 3,
        workspaceName: "Growth Team",
        ...overrides,
      },
      status: 200,
    },
    error: null,
    isFetching: false,
    isLoading: false,
    refetch,
  } as unknown as ReturnType<typeof useGetWorkspacesWorkspaceIdBillingMe>);
}

describe("ProfileBillingPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/ko/workspace-1/workspace/billing");
    useParams.mockReturnValue({
      workspaceId: "workspace-1",
    });
    vi.mocked(useToast).mockReturnValue({ showToast });
    vi.mocked(useProfileBillingActions).mockReturnValue({
      handleReturnedFromCheckout,
      isPortalPending: false,
      openPortal,
    });
    vi.mocked(useUpdateWorkspaceSeatsMutation).mockReturnValue({
      isUpdatingSeats: false,
      updateSeats,
    });
    mockBilling();
  });

  it("renders active Polar billing state and opens the billing portal", () => {
    renderWithProviders(<ProfileBillingPageClient />);

    expect(screen.getByRole("heading", { name: "플랜 및 결제" })).toBeInTheDocument();
    expect(screen.getByText("Growth Team")).toBeInTheDocument();
    expect(screen.getByText("활성화")).toBeInTheDocument();
    expect(screen.getByText("3 명")).toBeInTheDocument();
    expect(screen.getByText("5 명")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "결제 관리 열기" }));

    expect(openPortal).toHaveBeenCalledTimes(1);
  });

  it("shows member notice and hides admin actions when the user cannot manage billing", () => {
    mockBilling({
      canManageBilling: false,
    });

    renderWithProviders(<ProfileBillingPageClient />);

    expect(
      screen.getByText(
        "결제 수단 변경, 해지, 재구독은 현재 워크스페이스 관리자만 진행할 수 있습니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "결제 관리 열기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "한도 변경" })).not.toBeInTheDocument();
  });

  it("shows non-Polar entitlement guidance with a workspace contact link", () => {
    mockBilling({
      entitlementSource: "MANUAL_GRANT",
    });

    renderWithProviders(<ProfileBillingPageClient />);

    expect(screen.getByText(/운영자 제공 자격으로 Basic 기능을 이용하고 있어요/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "고객지원으로 문의" })).toHaveAttribute(
      "href",
      "/workspace-1/profile/contact",
    );
    expect(screen.queryByRole("button", { name: "결제 관리 열기" })).not.toBeInTheDocument();
  });

  it("shows manual review warning when billing requires review", () => {
    mockBilling({
      recentRefundCount: 2,
      recentRevokedCount: 1,
      requiresManualReview: true,
    });

    renderWithProviders(<ProfileBillingPageClient />);

    expect(
      screen.getByText("수동 검토가 필요한 결제 이력이 감지됐어요"),
    ).toBeInTheDocument();
    expect(screen.getByText(/안전한 결제 환경을 위해 결제 내역 확인이 필요합니다/)).toBeInTheDocument();
  });

  it("handles checkout return query and exposes manual refresh", async () => {
    window.history.replaceState(
      {},
      "",
      "/ko/workspace-1/workspace/billing?billing=success",
    );

    renderWithProviders(<ProfileBillingPageClient />);

    await waitFor(() => {
      expect(handleReturnedFromCheckout).toHaveBeenCalledTimes(1);
      expect(window.location.search).toBe("");
    });

    expect(screen.getByText("결제 확인 중")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /상태 새로고침/ }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("submits valid seat changes and rejects counts below current members", () => {
    vi.spyOn(window, "prompt").mockReturnValueOnce("7");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    renderWithProviders(<ProfileBillingPageClient />);

    fireEvent.click(screen.getByRole("button", { name: "한도 변경" }));

    expect(updateSeats).toHaveBeenCalledWith({
      data: {
        seatCount: 7,
      },
      workspaceId: "workspace-1",
    });

    vi.mocked(window.prompt).mockReturnValueOnce("2");
    fireEvent.click(screen.getByRole("button", { name: "한도 변경" }));

    expect(alertSpy).toHaveBeenCalledWith(
      "현재 남아 있는 멤버가 3명이라 한도를 2명으로 줄일 수 없습니다. 먼저 멤버를 1명 이상 내보낸 뒤 다시 시도해주세요.",
    );
    expect(updateSeats).toHaveBeenCalledTimes(1);
  });
});
