import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import JoinWorkspacePage from "./page";
import { useJoinWorkspaceMutation } from "./_hooks/useJoinWorkspaceMutation";

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

vi.mock("./_hooks/useJoinWorkspaceMutation", () => ({
  useJoinWorkspaceMutation: vi.fn(),
}));

const submitJoinWorkspace = vi.fn();

describe("JoinWorkspacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useJoinWorkspaceMutation).mockReturnValue({
      isPending: false,
      submitJoinWorkspace,
    });
  });

  it("renders the invite join form", () => {
    renderWithProviders(<JoinWorkspacePage />);

    expect(
      screen.getByRole("heading", { name: "초대코드로 참가하기" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("예: TEAM-AB12-CD34")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "참가하기" })).toBeDisabled();
  });

  it("submits a trimmed uppercase invite code", () => {
    const { container } = renderWithProviders(<JoinWorkspacePage />);

    fireEvent.change(screen.getByPlaceholderText("예: TEAM-AB12-CD34"), {
      target: { value: "  team12  " },
    });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(submitJoinWorkspace).toHaveBeenCalledWith("TEAM12");
  });

  it("renders validation errors from the form hook", () => {
    const { container } = renderWithProviders(<JoinWorkspacePage />);

    fireEvent.change(screen.getByPlaceholderText("예: TEAM-AB12-CD34"), {
      target: { value: "abc" },
    });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(screen.getByText("초대코드를 입력해주세요.")).toBeInTheDocument();
    expect(submitJoinWorkspace).not.toHaveBeenCalled();
  });

  it("shows pending state while joining", () => {
    vi.mocked(useJoinWorkspaceMutation).mockReturnValue({
      isPending: true,
      submitJoinWorkspace,
    });

    renderWithProviders(<JoinWorkspacePage />);

    expect(
      screen.getByText("워크스페이스에 참가하는 중입니다."),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("예: TEAM-AB12-CD34")).toBeDisabled();
    expect(screen.getByRole("button", { name: "" })).toBeDisabled();
  });
});
