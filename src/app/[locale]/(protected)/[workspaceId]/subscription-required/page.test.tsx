import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGetWorkspacesWorkspaceIdBillingMe } from "@/api/generated/billing/billing";
import { useSubscriptionRequiredActions } from "@/app/[locale]/(protected)/[workspaceId]/subscription-required/_hooks/useSubscriptionRequiredActions";
import { useProfileBillingActions } from "@/app/[locale]/(protected)/workspace/billing/_hooks/useProfileBillingActions";
import { useRouter } from "@/i18n/routing";
import { renderWithProviders } from "@/test/render";

import SubscriptionRequiredPage from "./page";

vi.mock("@/api/generated/billing/billing", () => ({
  useGetWorkspacesWorkspaceIdBillingMe: vi.fn(),
}));

vi.mock("@/app/[locale]/(protected)/[workspaceId]/subscription-required/_hooks/useSubscriptionRequiredActions", () => ({
  useSubscriptionRequiredActions: vi.fn(),
}));

vi.mock("@/app/[locale]/(protected)/workspace/billing/_hooks/useProfileBillingActions", () => ({
  useProfileBillingActions: vi.fn(),
}));

const replace = vi.fn();
vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: vi.fn(() => ({
    replace,
  })),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({
    workspaceId: "workspace-1",
  })),
}));

const startBasicCheckout = vi.fn();
const openPortal = vi.fn();

type BillingOverrides = Partial<{
  billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
  canManageBilling: boolean;
  entitlementSource: "MANUAL" | "NONE" | "POLAR";
  planCode: "BASIC" | "FREE" | "STANDARD";
  requiresManualReview: boolean;
}>;

function mockBilling(overrides: BillingOverrides) {
  vi.mocked(useGetWorkspacesWorkspaceIdBillingMe).mockReturnValue({
    data: {
      data: {
        billingStatus: "NONE",
        canManageBilling: false,
        entitlementSource: "NONE",
        planCode: "FREE",
        requiresManualReview: false,
        ...overrides,
      },
      status: 200,
    },
  } as ReturnType<typeof useGetWorkspacesWorkspaceIdBillingMe>);
}

describe("SubscriptionRequiredPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSubscriptionRequiredActions).mockReturnValue({
      isCheckoutPending: false,
      startBasicCheckout,
    });
    vi.mocked(useProfileBillingActions).mockReturnValue({
      handleReturnedFromCheckout: vi.fn(),
      isPortalPending: false,
      openPortal,
    });
    mockBilling({});
  });

  it("lets a billing admin start Basic checkout when the workspace has no subscription", () => {
    mockBilling({
      billingStatus: "NONE",
      canManageBilling: true,
      entitlementSource: "NONE",
      planCode: "FREE",
    });

    renderWithProviders(<SubscriptionRequiredPage />);

    expect(
      screen.getByRole("heading", { name: "Basic 구독이 필요합니다" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Basic 구독하기/ }));

    expect(startBasicCheckout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "문의하기" })).toHaveAttribute(
      "href",
      "/workspace-1/profile/contact",
    );
  });

  it("shows billing and contact links for members who cannot manage billing", () => {
    mockBilling({
      billingStatus: "NONE",
      canManageBilling: false,
      planCode: "FREE",
    });

    renderWithProviders(<SubscriptionRequiredPage />);

    expect(
      screen.getByText(
        "워크스페이스의 Basic 구독이 활성화되지 않아 운영 화면에 접근할 수 없습니다. 워크스페이스 관리자에게 문의해 주세요.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /결제 상태 확인하기/ }),
    ).toHaveAttribute("href", "/workspace-1/workspace/billing");
    expect(screen.getByRole("link", { name: "문의하기" })).toHaveAttribute(
      "href",
      "/workspace-1/profile/contact",
    );
  });

  it("opens the billing portal for a Polar workspace that can manage billing", () => {
    mockBilling({
      billingStatus: "EXPIRED",
      canManageBilling: true,
      entitlementSource: "POLAR",
      planCode: "BASIC",
    });

    renderWithProviders(<SubscriptionRequiredPage />);

    fireEvent.click(screen.getByRole("button", { name: /결제 관리/ }));

    expect(openPortal).toHaveBeenCalledTimes(1);
  });

  it("redirects to the personal dashboard when billing has operational access", async () => {
    mockBilling({
      billingStatus: "ACTIVE",
      canManageBilling: true,
      entitlementSource: "POLAR",
      planCode: "BASIC",
    });

    renderWithProviders(<SubscriptionRequiredPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/workspace-1/dashboard/my");
    });
  });
});
