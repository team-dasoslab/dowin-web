import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePostAuthLogin, usePostAuthSignup } from "@/api/generated/auth/auth";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import { renderWithProviders } from "@/test/render";

import LoginPageClient from "./LoginPageClient";

vi.mock("@/api/generated/auth/auth", () => ({
  usePostAuthLogin: vi.fn(),
  usePostAuthSignup: vi.fn(),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

const push = vi.fn();
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
  useRouter: vi.fn(() => ({
    push,
  })),
}));

const searchParamsGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: searchParamsGet,
  }),
}));

vi.mock("@/lib/client/gtag", () => ({
  trackEvent: vi.fn(),
}));

const showToast = vi.fn();
const loginMutateAsync = vi.fn();
const signupMutateAsync = vi.fn();

describe("LoginPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    searchParamsGet.mockReturnValue(null);
    vi.mocked(useToast).mockReturnValue({ showToast });
    vi.mocked(useRouter).mockReturnValue({
      push,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePostAuthLogin).mockReturnValue({
      isPending: false,
      mutateAsync: loginMutateAsync,
    } as unknown as ReturnType<typeof usePostAuthLogin>);
    vi.mocked(usePostAuthSignup).mockReturnValue({
      isPending: false,
      mutateAsync: signupMutateAsync,
    } as unknown as ReturnType<typeof usePostAuthSignup>);
  });

  it("renders login form and recovery link", () => {
    renderWithProviders(<LoginPageClient />);

    expect(screen.getByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(screen.getByLabelText("아이디")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "계정 복구" })).toHaveAttribute(
      "href",
      "/account-recovery",
    );
  });

  it("logs in, stores push prompt intent, and follows next path", async () => {
    searchParamsGet.mockReturnValue("/workspace-1/dashboard/my");
    loginMutateAsync.mockResolvedValue({
      data: {
        user: {
          id: 1,
        },
      },
      status: 200,
    });

    renderWithProviders(<LoginPageClient />);

    fireEvent.change(screen.getByLabelText("아이디"), {
      target: {
        value: "user123",
      },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: {
        value: "password123",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(loginMutateAsync).toHaveBeenCalledWith({
        data: {
          customId: "user123",
          password: "password123",
        },
      });
      expect(window.sessionStorage.getItem("dowin.intent.push-prompt")).toBe(
        "true",
      );
      expect(push).toHaveBeenCalledWith("/workspace-1/dashboard/my");
    });
  });

  it("shows a login error without redirecting when credentials are invalid", async () => {
    loginMutateAsync.mockRejectedValue({
      response: {
        data: {
          error: {
            code: "INVALID_CREDENTIALS",
          },
        },
        status: 401,
      },
    });

    renderWithProviders(<LoginPageClient />);

    fireEvent.change(screen.getByLabelText("아이디"), {
      target: {
        value: "user123",
      },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: {
        value: "wrong-password",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByText("아이디 또는 비밀번호가 올바르지 않습니다.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("validates signup fields before calling the API", () => {
    renderWithProviders(<LoginPageClient />);

    fireEvent.click(screen.getByRole("button", { name: "회원가입" }));
    fireEvent.change(screen.getByLabelText("아이디"), {
      target: {
        value: "ab",
      },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: {
        value: "short",
      },
    });
    fireEvent.change(screen.getByLabelText("닉네임"), {
      target: {
        value: "홍길동",
      },
    });
    fireEvent.submit(screen.getByRole("button", { name: "회원가입" }).closest("form") as HTMLFormElement);

    expect(
      screen.getByText("아이디는 3~20자의 영문/숫자여야 합니다."),
    ).toBeInTheDocument();
    expect(signupMutateAsync).not.toHaveBeenCalled();
  });

  it("shows recovery codes after signup and continues to workspace creation", async () => {
    signupMutateAsync.mockResolvedValue({
      data: {
        recoveryCodes: ["ABCD-EFGHIJ", "KLMN-OPQRST"],
        user: {
          id: 7,
        },
      },
      status: 201,
    });

    renderWithProviders(<LoginPageClient />);

    fireEvent.click(screen.getByRole("button", { name: "회원가입" }));
    fireEvent.change(screen.getByLabelText("닉네임"), {
      target: {
        value: "홍길동",
      },
    });
    fireEvent.change(screen.getByLabelText("아이디"), {
      target: {
        value: "user123",
      },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: {
        value: "password123",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "회원가입" }));

    expect(await screen.findByText("ABCD-EFGHIJ")).toBeInTheDocument();
    expect(screen.getByText("KLMN-OPQRST")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "계속하기" }));

    expect(push).toHaveBeenCalledWith("/workspace/new");
  });

  it("consumes flash toast from account deletion redirect", () => {
    window.sessionStorage.setItem(
      "dowin.flash.toast",
      JSON.stringify({
        message: "탈퇴를 완료했어요. 다음에 또 만나요.",
        type: "success",
      }),
    );

    renderWithProviders(<LoginPageClient />);

    expect(showToast).toHaveBeenCalledWith(
      "success",
      "탈퇴를 완료했어요. 다음에 또 만나요.",
    );
    expect(window.sessionStorage.getItem("dowin.flash.toast")).toBeNull();
  });
});
