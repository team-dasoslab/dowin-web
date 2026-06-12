import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGetWorkspacesWorkspaceIdBillingMe } from "@/api/generated/billing/billing";
import { usePathname, useRouter } from "@/i18n/routing";
import { renderWithProviders } from "@/test/render";

import { ProtectedContentLayout } from "./ProtectedContentLayout";

vi.mock("@/api/generated/billing/billing", () => ({
  useGetWorkspacesWorkspaceIdBillingMe: vi.fn(),
}));

const replace = vi.fn();
vi.mock("@/i18n/routing", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({
    replace,
  })),
}));

const useParams = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => useParams(),
}));

function mockBilling(overrides: {
  billingStatus?: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
  planCode?: "BASIC" | "FREE" | "STANDARD";
  requiresManualReview?: boolean;
} = {}) {
  vi.mocked(useGetWorkspacesWorkspaceIdBillingMe).mockReturnValue({
    data: {
      data: {
        billingStatus: "NONE",
        planCode: "FREE",
        requiresManualReview: false,
        ...overrides,
      },
      status: 200,
    },
  } as ReturnType<typeof useGetWorkspacesWorkspaceIdBillingMe>);
}

function renderLayout() {
  return renderWithProviders(
    <ProtectedContentLayout>
      <main>Protected content</main>
    </ProtectedContentLayout>,
  );
}

describe("ProtectedContentLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue("/workspace-1/dashboard/my");
    useParams.mockReturnValue({
      workspaceId: "workspace-1",
    });
    mockBilling();
  });

  it("redirects operational workspace paths to subscription-required when billing is inactive", async () => {
    renderLayout();

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(useGetWorkspacesWorkspaceIdBillingMe).toHaveBeenCalledWith(
      "workspace-1",
      {
        query: {
          enabled: true,
          retry: false,
        },
      },
    );
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        "/workspace-1/subscription-required",
      );
    });
  });

  it("keeps operational workspace paths available when billing has access", async () => {
    mockBilling({
      billingStatus: "ACTIVE",
      planCode: "BASIC",
    });

    renderLayout();

    await waitFor(() => {
      expect(replace).not.toHaveBeenCalled();
    });
  });

  it("does not enable billing gate checks for non-operational workspace paths", () => {
    vi.mocked(usePathname).mockReturnValue("/workspace-1/workspace/billing");

    renderLayout();

    expect(useGetWorkspacesWorkspaceIdBillingMe).toHaveBeenCalledWith(
      "workspace-1",
      {
        query: {
          enabled: false,
          retry: false,
        },
      },
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
