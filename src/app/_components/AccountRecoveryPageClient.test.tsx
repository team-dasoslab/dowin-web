import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  usePostAuthRecoveryCodesVerify,
  usePutAuthPasswordByRecoveryCode,
} from "@/api/generated/auth/auth";
import { renderWithProviders } from "@/test/render";

import AccountRecoveryPageClient from "./AccountRecoveryPageClient";

vi.mock("@/api/generated/auth/auth", () => ({
  usePostAuthRecoveryCodesVerify: vi.fn(),
  usePutAuthPasswordByRecoveryCode: vi.fn(),
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

const verifyMutateAsync = vi.fn();
const resetMutateAsync = vi.fn();

describe("AccountRecoveryPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePostAuthRecoveryCodesVerify).mockReturnValue({
      isPending: false,
      mutateAsync: verifyMutateAsync,
    } as unknown as ReturnType<typeof usePostAuthRecoveryCodesVerify>);
    vi.mocked(usePutAuthPasswordByRecoveryCode).mockReturnValue({
      isPending: false,
      mutateAsync: resetMutateAsync,
    } as unknown as ReturnType<typeof usePutAuthPasswordByRecoveryCode>);
  });

  it("renders recovery code form and login link", () => {
    renderWithProviders(<AccountRecoveryPageClient />);

    expect(screen.getByRole("heading", { name: "계정 복구" })).toBeInTheDocument();
    expect(screen.getByLabelText("복원코드")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "로그인하기" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("verifies a recovery code and reveals reset password form", async () => {
    verifyMutateAsync.mockResolvedValue({
      data: {
        user: {
          customId: "user123",
          nickname: "홍길동",
        },
      },
      status: 200,
    });

    renderWithProviders(<AccountRecoveryPageClient />);

    fireEvent.change(screen.getByLabelText("복원코드"), {
      target: {
        value: "ABCD-EFGHIJ",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "계정 조회" }));

    expect(await screen.findByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("user123")).toBeInTheDocument();
    expect(screen.getByLabelText("새 비밀번호")).toBeInTheDocument();
    expect(verifyMutateAsync).toHaveBeenCalledWith({
      data: {
        recoveryCode: "ABCD-EFGHIJ",
      },
    });
  });

  it("shows code validation error when recovery code is not found", async () => {
    verifyMutateAsync.mockRejectedValue({
      response: {
        status: 404,
      },
    });

    renderWithProviders(<AccountRecoveryPageClient />);

    fireEvent.change(screen.getByLabelText("복원코드"), {
      target: {
        value: "BAD-CODE",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "계정 조회" }));

    expect(await screen.findByText("복원코드를 확인해주세요.")).toBeInTheDocument();
    expect(screen.queryByLabelText("새 비밀번호")).not.toBeInTheDocument();
  });

  it("validates new password before reset request", async () => {
    verifyMutateAsync.mockResolvedValue({
      data: {
        user: {
          customId: "user123",
          nickname: "홍길동",
        },
      },
      status: 200,
    });

    renderWithProviders(<AccountRecoveryPageClient />);

    fireEvent.change(screen.getByLabelText("복원코드"), {
      target: {
        value: "ABCD-EFGHIJ",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "계정 조회" }));
    await screen.findByLabelText("새 비밀번호");

    fireEvent.change(screen.getByLabelText("새 비밀번호"), {
      target: {
        value: "short",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 재설정" }));

    expect(
      screen.getByText(
        "비밀번호는 8자 이상의 영문/숫자/허용 특수문자 조합이어야 합니다.",
      ),
    ).toBeInTheDocument();
    expect(resetMutateAsync).not.toHaveBeenCalled();
  });

  it("resets password and returns to code entry state", async () => {
    verifyMutateAsync.mockResolvedValue({
      data: {
        user: {
          customId: "user123",
          nickname: "홍길동",
        },
      },
      status: 200,
    });
    resetMutateAsync.mockResolvedValue({
      status: 200,
    });

    renderWithProviders(<AccountRecoveryPageClient />);

    fireEvent.change(screen.getByLabelText("복원코드"), {
      target: {
        value: "ABCD-EFGHIJ",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "계정 조회" }));
    await screen.findByLabelText("새 비밀번호");

    fireEvent.change(screen.getByLabelText("새 비밀번호"), {
      target: {
        value: "newPassword123",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 재설정" }));

    await waitFor(() => {
      expect(resetMutateAsync).toHaveBeenCalledWith({
        data: {
          newPassword: "newPassword123",
          recoveryCode: "ABCD-EFGHIJ",
        },
      });
    });
    expect(
      screen.getByText("비밀번호를 재설정했습니다. 로그인 화면으로 이동해주세요."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("새 비밀번호")).not.toBeInTheDocument();
  });
});
