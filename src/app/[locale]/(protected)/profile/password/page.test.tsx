import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import ProfilePasswordPage from "./page";
import { usePasswordChangeAction } from "./_hooks/usePasswordChangeAction";

vi.mock("./_hooks/usePasswordChangeAction", () => ({
  usePasswordChangeAction: vi.fn(),
}));

const submit = vi.fn();

describe("ProfilePasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePasswordChangeAction).mockReturnValue({
      isSubmitting: false,
      submit,
    });
  });

  it("renders the password change screen", () => {
    renderWithProviders(<ProfilePasswordPage />);

    expect(screen.getAllByRole("heading", { name: "비밀번호 변경" }))
      .toHaveLength(2);
    expect(screen.getByPlaceholderText("현재 비밀번호를 입력하세요"))
      .toHaveAttribute("type", "password");
    expect(screen.getByPlaceholderText("새 비밀번호를 입력하세요"))
      .toHaveAttribute("type", "password");
    expect(
      screen.getByText("8자 이상의 영문, 숫자, 허용된 특수문자를 사용할 수 있어요."),
    ).toBeInTheDocument();
  });

  it("passes the latest password values to the action hook", () => {
    renderWithProviders(<ProfilePasswordPage />);

    fireEvent.change(screen.getByPlaceholderText("현재 비밀번호를 입력하세요"), {
      target: { value: "old-password" },
    });
    fireEvent.change(screen.getByPlaceholderText("새 비밀번호를 입력하세요"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByPlaceholderText("새 비밀번호를 한 번 더 입력하세요"), {
      target: { value: "new-password" },
    });

    expect(usePasswordChangeAction).toHaveBeenLastCalledWith(
      expect.objectContaining({
        currentPassword: "old-password",
        newPassword: "new-password",
      }),
    );
  });

  it("submits through the password action hook", () => {
    renderWithProviders(<ProfilePasswordPage />);

    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("renders disabled submitting state", () => {
    vi.mocked(usePasswordChangeAction).mockReturnValue({
      isSubmitting: true,
      submit,
    });

    renderWithProviders(<ProfilePasswordPage />);

    expect(screen.getByRole("button", { name: "변경 중..." })).toBeDisabled();
  });
});
