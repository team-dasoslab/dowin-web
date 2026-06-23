import { postWorkspacesWorkspaceIdBillingCheckout } from "@/api/generated/billing/billing";
import { useToast } from "@/context/ToastContext";
import { renderWithProviders } from "@/test/render";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSubscriptionRequiredActions } from "./useSubscriptionRequiredActions";

vi.mock("@/api/generated/billing/billing", () => ({
  postWorkspacesWorkspaceIdBillingCheckout: vi.fn(),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/lib/client/gtag", () => ({
  trackEvent: vi.fn(),
}));

const showToast = vi.fn();

function TestHarness() {
  const { startBasicCheckout } = useSubscriptionRequiredActions("ws_123");

  return (
    <button type="button" onClick={() => void startBasicCheckout()}>
      start
    </button>
  );
}

describe("useSubscriptionRequiredActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(
      {},
      "",
      "/ko/ws_123/dashboard/my?view=week",
    );
    vi.mocked(useToast).mockReturnValue({ showToast });
    vi.mocked(postWorkspacesWorkspaceIdBillingCheckout).mockResolvedValue({
      data: {},
      status: 200,
    } as unknown as Awaited<
      ReturnType<typeof postWorkspacesWorkspaceIdBillingCheckout>
    >);
  });

  it("checkout 요청에 현재 경로를 returnTo로 전달한다", async () => {
    renderWithProviders(<TestHarness />);

    fireEvent.click(screen.getByRole("button", { name: "start" }));

    await waitFor(() => {
      expect(postWorkspacesWorkspaceIdBillingCheckout).toHaveBeenCalledWith(
        "ws_123",
        {
          returnTo: "/ko/ws_123/dashboard/my?view=week",
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            "Idempotency-Key": expect.any(String),
          }),
        }),
      );
    });
  });
});
