import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGetUsersMe, usePutUsersMe } from "@/api/generated/profile/profile";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import koMessages from "@/messages/ko.json";
import { createTestQueryClient } from "@/test/render";

import { useProfileAvatar } from "./useProfileAvatar";

vi.mock("@/api/generated/profile/profile", () => ({
  getGetUsersMeQueryKey: vi.fn(() => ["users-me"]),
  useGetUsersMe: vi.fn(),
  usePutUsersMe: vi.fn(),
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

function mockProfile(
  overrides: Partial<ReturnType<typeof useGetUsersMe>> = {},
) {
  vi.mocked(useGetUsersMe).mockReturnValue({
    data: {
      data: {
        avatarKey: "smile.blue",
        id: 1,
        nickname: "홍길동",
      },
      status: 200,
    },
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useGetUsersMe>);
}

function renderProfileAvatar(queryClient = createTestQueryClient()) {
  return {
    queryClient,
    ...renderHook(() => useProfileAvatar(), {
      wrapper: createWrapper(queryClient),
    }),
  };
}

describe("useProfileAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useToast).mockReturnValue({ showToast });
    vi.mocked(usePutUsersMe).mockReturnValue({
      isPending: false,
      mutateAsync,
    } as unknown as ReturnType<typeof usePutUsersMe>);
    mockProfile();
  });

  it("returns current profile state", () => {
    const { result } = renderProfileAvatar();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.user?.nickname).toBe("홍길동");
  });

  it("redirects when profile is missing after loading", async () => {
    mockProfile({
      data: undefined,
      isLoading: false,
    } as Partial<ReturnType<typeof useGetUsersMe>>);

    renderProfileAvatar();

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "error",
        "프로필 정보를 불러오지 못해 홈으로 이동합니다.",
      );
      expect(replace).toHaveBeenCalledWith("/");
    });
  });

  it("does nothing when selecting the current avatar", async () => {
    const { result } = renderProfileAvatar();

    await act(async () => {
      await result.current.updateAvatar("smile.blue", "smile.blue");
    });

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("does not update when confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result } = renderProfileAvatar();

    await act(async () => {
      await result.current.updateAvatar("smile.blue", "smile.green");
    });

    expect(window.confirm).toHaveBeenCalledWith("프로필 아이콘을 변경할까요?");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("updates avatar, invalidates profile/dashboard queries, and shows success toast", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mutateAsync.mockResolvedValue({
      data: {
        avatarKey: "smile.green",
      },
      status: 200,
    });
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderProfileAvatar(queryClient);

    await act(async () => {
      await result.current.updateAvatar("smile.blue", "smile.green");
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      data: {
        avatarKey: "smile.green",
      },
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["users-me"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(showToast).toHaveBeenCalledWith(
      "success",
      "프로필 아이콘이 변경되었습니다.",
    );
    expect(result.current.isSaving).toBe(false);
  });

  it("shows API error message when avatar update fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mutateAsync.mockRejectedValue({
      response: {
        data: {
          error: {
            message: "아바타 저장 실패",
          },
        },
        status: 500,
      },
    });
    const { result } = renderProfileAvatar();

    await act(async () => {
      await result.current.updateAvatar("smile.blue", "smile.red");
    });

    expect(showToast).toHaveBeenCalledWith("error", "아바타 저장 실패");
    expect(result.current.isSaving).toBe(false);
  });
});
