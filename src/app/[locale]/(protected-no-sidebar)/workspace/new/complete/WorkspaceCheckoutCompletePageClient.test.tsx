import { screen, waitFor } from "@testing-library/react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { postWorkspacesCheckoutComplete } from "@/api/generated/workspace/workspace";
import { renderWithProviders } from "@/test/render";

import WorkspaceCheckoutCompletePageClient from "./WorkspaceCheckoutCompletePageClient";

vi.mock("@/api/generated/workspace/workspace", () => ({
  postWorkspacesCheckoutComplete: vi.fn(),
}));

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
}));

const originalLocation = window.location;

describe("WorkspaceCheckoutCompletePageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        href: "",
      },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("shows an error and skips completion when workspace checkout id is missing", async () => {
    renderWithProviders(
      <WorkspaceCheckoutCompletePageClient
        checkoutId="checkout-1"
        workspaceCheckoutId=""
      />,
    );

    expect(screen.getByRole("heading", { name: "결제 확인 중" })).toBeInTheDocument();
    expect(
      await screen.findByText(
        "워크스페이스 결제 정보를 찾을 수 없습니다. 다시 진행해주세요.",
      ),
    ).toBeInTheDocument();
    expect(postWorkspacesCheckoutComplete).not.toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: "워크스페이스 만들기로 돌아가기" }),
    ).toHaveAttribute("href", "/workspace/new");
  });

  it("completes checkout once and redirects to setup", async () => {
    vi.mocked(postWorkspacesCheckoutComplete).mockResolvedValue({
      data: {
        workspaceId: "workspace-1",
      },
      status: 201,
    } as Awaited<ReturnType<typeof postWorkspacesCheckoutComplete>>);

    renderWithProviders(
      <WorkspaceCheckoutCompletePageClient
        checkoutId="checkout-1"
        workspaceCheckoutId="workspace-checkout-1"
      />,
    );

    await waitFor(() => {
      expect(postWorkspacesCheckoutComplete).toHaveBeenCalledWith({
        checkoutId: "checkout-1",
        workspaceCheckoutId: "workspace-checkout-1",
      });
      expect(window.location.href).toBe("/ko/workspace-1/setup");
    });
  });

  it("shows API error message when checkout completion fails", async () => {
    vi.mocked(postWorkspacesCheckoutComplete).mockRejectedValue({
      response: {
        data: {
          error: {
            message: "결제 확인이 아직 끝나지 않았습니다.",
          },
        },
        status: 409,
      },
    });

    renderWithProviders(
      <WorkspaceCheckoutCompletePageClient
        checkoutId="checkout-1"
        workspaceCheckoutId="workspace-checkout-1"
      />,
    );

    expect(
      await screen.findByText("결제 확인이 아직 끝나지 않았습니다."),
    ).toBeInTheDocument();
    expect(window.location.href).toBe("");
  });
});
