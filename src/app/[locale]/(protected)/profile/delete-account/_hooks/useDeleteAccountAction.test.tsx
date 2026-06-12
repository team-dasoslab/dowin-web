import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteUsersMe } from "@/api/generated/profile/profile";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import koMessages from "@/messages/ko.json";
import { createTestQueryClient } from "@/test/render";

import { useDeleteAccountAction } from "./useDeleteAccountAction";

vi.mock("@/api/generated/profile/profile", () => ({
  useDeleteUsersMe: vi.fn(),
}));

const replace = vi.fn();
vi.mock("@/i18n/routing", () => ({
  useRouter: vi.fn(() => ({
    replace,
  })),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

const showToast = vi.fn();
const mutateAsync = vi.fn();

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider
        locale="ko"
        messages={koMessages}
        timeZone="Asia/Seoul"
      >
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </NextIntlClientProvider>
    );
  };
}

function renderDeleteAccountAction({
  currentPassword = "password123",
  queryClient = createTestQueryClient(),
  validate = vi.fn(() => null),
}: {
  currentPassword?: string;
  queryClient?: QueryClient;
  validate?: () => string | null;
} = {}) {
  return {
    queryClient,
    validate,
    ...renderHook(
      () =>
        useDeleteAccountAction({
          currentPassword,
          validate,
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    ),
  };
}

describe("useDeleteAccountAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    vi.mocked(useRouter).mockReturnValue({
      replace,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useToast).mockReturnValue({ showToast });
    vi.mocked(useDeleteUsersMe).mockReturnValue({
      isPending: false,
      mutateAsync,
    } as unknown as ReturnType<typeof useDeleteUsersMe>);
  });

  it("shows validation errors before calling the API", async () => {
    const validate = vi.fn(() => "현재 비밀번호를 입력해주세요.");
    const { result } = renderDeleteAccountAction({ validate });

    await act(async () => {
      await result.current.submit();
    });

    expect(validate).toHaveBeenCalledTimes(1);
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      "error",
      "현재 비밀번호를 입력해주세요.",
    );
  });

  it("deletes the account, stores flash toast, clears query cache, and redirects", async () => {
    mutateAsync.mockResolvedValue({
      status: 204,
    });
    const queryClient = createTestQueryClient();
    const clearSpy = vi.spyOn(queryClient, "clear");
    const { result } = renderDeleteAccountAction({ queryClient });

    await act(async () => {
      await result.current.submit();
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      data: {
        currentPassword: "password123",
      },
    });
    expect(window.sessionStorage.getItem("dowin.flash.toast")).toBe(
      JSON.stringify({
        message: "탈퇴를 완료했어요. 다음에 또 만나요.",
        type: "success",
      }),
    );
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("shows API error message and keeps the user on the page when deletion fails", async () => {
    mutateAsync.mockRejectedValue({
      response: {
        data: {
          error: {
            message: "비밀번호가 일치하지 않습니다.",
          },
        },
        status: 400,
      },
    });
    const { result } = renderDeleteAccountAction();

    await act(async () => {
      await result.current.submit();
    });

    expect(showToast).toHaveBeenCalledWith(
      "error",
      "비밀번호가 일치하지 않습니다.",
    );
    expect(replace).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });
});
