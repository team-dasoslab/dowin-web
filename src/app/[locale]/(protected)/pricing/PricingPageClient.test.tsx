import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGetWorkspacesWorkspaceIdBillingMe } from "@/api/generated/billing/billing";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { useNativeApp } from "@/context/NativeAppContext";
import { renderWithProviders } from "@/test/render";

import { useProfileBillingActions } from "../workspace/billing/_hooks/useProfileBillingActions";
import { PricingPageClient } from "./PricingPageClient";

vi.mock("@/api/generated/billing/billing", () => ({
  useGetWorkspacesWorkspaceIdBillingMe: vi.fn(),
}));

vi.mock("@/api/generated/workspace/workspace", () => ({
  useGetWorkspacesMe: vi.fn(),
}));

vi.mock("@/context/NativeAppContext", () => ({
  useNativeApp: vi.fn(),
}));

vi.mock("../workspace/billing/_hooks/useProfileBillingActions", () => ({
  useProfileBillingActions: vi.fn(),
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

const openPortal = vi.fn();

type BillingOverrides = Partial<{
  billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
  canManageBilling: boolean;
  currentPeriodEnd: string | null;
  entitlementSource:
    | "BETA_PROMOTIONAL_GRANT"
    | "INTERNAL_TEST"
    | "MANUAL_GRANT"
    | "PARTNER"
    | "POLAR"
    | null;
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
        workspaceName: "Growth Team",
        ...overrides,
      },
      status: 200,
    },
    error: null,
    isLoading: false,
  } as unknown as ReturnType<typeof useGetWorkspacesWorkspaceIdBillingMe>);
}

describe("PricingPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useParams.mockReturnValue({
      workspaceId: "workspace-1",
    });
    vi.mocked(useNativeApp).mockReturnValue(false);
    vi.mocked(useGetWorkspacesMe).mockReturnValue({
      data: {
        data: {
          id: "workspace-from-me",
        },
        status: 200,
      },
    } as ReturnType<typeof useGetWorkspacesMe>);
    vi.mocked(useProfileBillingActions).mockReturnValue({
      handleReturnedFromCheckout: vi.fn(),
      isPortalPending: false,
      openPortal,
    });
    mockBilling();
  });

  it("renders current Basic billing status and opens the Polar billing portal", () => {
    renderWithProviders(<PricingPageClient />);

    expect(screen.getByRole("heading", { name: "플랜 안내" })).toBeInTheDocument();
    expect(screen.getByText("Growth Team")).toBeInTheDocument();
    expect(screen.getByText("Basic 구독 상태")).toBeInTheDocument();
    expect(screen.getByText("이용 중")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "결제 관리 열기" }));

    expect(openPortal).toHaveBeenCalledTimes(1);
  });

  it("hides portal action and shows member notice when the user cannot manage billing", () => {
    mockBilling({
      canManageBilling: false,
    });

    renderWithProviders(<PricingPageClient />);

    expect(
      screen.getByText(
        "구독 해지와 결제 관리는 현재 워크스페이스 관리자만 진행할 수 있습니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "결제 관리 열기" })).not.toBeInTheDocument();
  });

  it("shows non-Polar entitlement guidance with workspace contact link", () => {
    mockBilling({
      entitlementSource: "MANUAL_GRANT",
    });

    renderWithProviders(<PricingPageClient />);

    expect(
      screen.getByText(/현재 운영자 또는 제휴 자격으로 Basic 기능을 이용하고 있어요/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "고객지원으로 문의" })).toHaveAttribute(
      "href",
      "/workspace-1/profile/contact",
    );
    expect(screen.queryByRole("button", { name: "결제 관리 열기" })).not.toBeInTheDocument();
  });

  it("uses workspace from profile when route params do not include workspace id", () => {
    useParams.mockReturnValue({});

    renderWithProviders(<PricingPageClient />);

    expect(useGetWorkspacesWorkspaceIdBillingMe).toHaveBeenCalledWith(
      "workspace-from-me",
      {
        query: {
          enabled: true,
          retry: false,
        },
      },
    );
    expect(useProfileBillingActions).toHaveBeenCalledWith("workspace-from-me");
  });

  it("shows app unavailable state in the native app", () => {
    vi.mocked(useNativeApp).mockReturnValue(true);

    renderWithProviders(<PricingPageClient />);

    expect(screen.getByText("이 화면은 앱에서 제공되지 않아요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "프로필로 돌아가기" })).toHaveAttribute(
      "href",
      "/workspace-1/profile",
    );
  });
});
