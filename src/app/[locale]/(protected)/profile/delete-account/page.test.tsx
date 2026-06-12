import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import ProfileDeleteAccountPage from "./page";
import { useDeleteAccountAction } from "./_hooks/useDeleteAccountAction";
import { useDeleteAccountForm } from "./_hooks/useDeleteAccountForm";

vi.mock("./_hooks/useDeleteAccountForm", () => ({
  useDeleteAccountForm: vi.fn(),
}));

vi.mock("./_hooks/useDeleteAccountAction", () => ({
  useDeleteAccountAction: vi.fn(),
}));

const setCurrentPassword = vi.fn();
const setConfirmationText = vi.fn();
const submit = vi.fn();
const validate = vi.fn();

function mockForm() {
  vi.mocked(useDeleteAccountForm).mockReturnValue({
    confirmationText: "",
    currentPassword: "",
    setConfirmationText,
    setCurrentPassword,
    validate,
  });
}

function mockAction(isSubmitting = false) {
  vi.mocked(useDeleteAccountAction).mockReturnValue({
    isSubmitting,
    submit,
  });
}

describe("ProfileDeleteAccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockForm();
    mockAction();
  });

  it("renders delete account warning and fields", () => {
    renderWithProviders(<ProfileDeleteAccountPage />);

    expect(screen.getByRole("heading", { name: "서비스 탈퇴" })).toBeInTheDocument();
    expect(screen.getByText("탈퇴하기")).toBeInTheDocument();
    expect(
      screen.getByText(
        "탈퇴하면 점수판, 액션 아이템, 기록, 워크스페이스 참여 정보가 모두 삭제되며 되돌릴 수 없습니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("현재 비밀번호")).toBeInTheDocument();
    expect(screen.getByLabelText("탈퇴 확인 문구")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "계정 탈퇴" })).toBeEnabled();
  });

  it("wires field changes and submit to hooks", () => {
    renderWithProviders(<ProfileDeleteAccountPage />);

    fireEvent.change(screen.getByLabelText("현재 비밀번호"), {
      target: {
        value: "password123",
      },
    });
    fireEvent.change(screen.getByLabelText("탈퇴 확인 문구"), {
      target: {
        value: "탈퇴합니다",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "계정 탈퇴" }));

    expect(setCurrentPassword).toHaveBeenCalledWith("password123");
    expect(setConfirmationText).toHaveBeenCalledWith("탈퇴합니다");
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("disables submit while deletion is submitting", () => {
    mockAction(true);

    renderWithProviders(<ProfileDeleteAccountPage />);

    expect(screen.getByRole("button", { name: "탈퇴 처리 중..." })).toBeDisabled();
  });
});
