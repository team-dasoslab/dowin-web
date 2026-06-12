import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import NewWorkspacePage from "./page";
import { useCreateWorkspaceMutation } from "./_hooks/useCreateWorkspaceMutation";

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
    back: vi.fn(),
    push: vi.fn(),
  })),
}));

vi.mock("./_hooks/useCreateWorkspaceMutation", () => ({
  useCreateWorkspaceMutation: vi.fn(),
}));

const submitCreateWorkspace = vi.fn();

describe("NewWorkspacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateWorkspaceMutation).mockReturnValue({
      isPending: false,
      submitCreateWorkspace,
    });
  });

  it("renders the workspace creation form", () => {
    renderWithProviders(<NewWorkspacePage />);

    expect(
      screen.getByRole("heading", { name: "새 워크스페이스 만들기" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("예: 마케팅 팀, 회사명")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("예: 5")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "결제하고 생성하기" }),
    ).toBeDisabled();
    expect(screen.getByRole("link", { name: "초대코드로 참여하기" }))
      .toHaveAttribute("href", "/workspace/join");
  });

  it("submits a validated workspace name and seat count", () => {
    const { container } = renderWithProviders(<NewWorkspacePage />);

    fireEvent.change(screen.getByPlaceholderText("예: 마케팅 팀, 회사명"), {
      target: { value: "  Growth Team  " },
    });
    fireEvent.change(screen.getByPlaceholderText("예: 5"), {
      target: { value: "4" },
    });

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(submitCreateWorkspace).toHaveBeenCalledWith("Growth Team", 4, "");
  });

  it("renders validation errors from the form hook", () => {
    const { container } = renderWithProviders(<NewWorkspacePage />);

    fireEvent.change(screen.getByPlaceholderText("예: 마케팅 팀, 회사명"), {
      target: { value: "Growth Team" },
    });
    fireEvent.change(screen.getByPlaceholderText("예: 5"), {
      target: { value: "0" },
    });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(
      screen.getByText("좌석 수는 1~999 사이의 정수여야 합니다."),
    ).toBeInTheDocument();
    expect(submitCreateWorkspace).not.toHaveBeenCalled();
  });

  it("shows pending state while workspace creation is running", () => {
    vi.mocked(useCreateWorkspaceMutation).mockReturnValue({
      isPending: true,
      submitCreateWorkspace,
    });

    renderWithProviders(<NewWorkspacePage />);

    expect(screen.getByText("결제 화면을 준비하는 중입니다.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("예: 마케팅 팀, 회사명")).toBeDisabled();
    expect(screen.getByRole("button", { name: "" })).toBeDisabled();
  });
});
