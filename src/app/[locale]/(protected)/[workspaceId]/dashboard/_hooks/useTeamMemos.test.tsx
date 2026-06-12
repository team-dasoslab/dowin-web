import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getGetWorkspacesWorkspaceIdDashboardTeamMemosQueryKey,
  useDeleteWorkspacesWorkspaceIdDashboardTeamMemosMemoId,
  useGetWorkspacesWorkspaceIdDashboardTeamMemos,
  usePatchWorkspacesWorkspaceIdDashboardTeamMemosMemoIdResolve,
  usePostWorkspacesWorkspaceIdDashboardTeamMemos,
} from "@/api/generated/dashboard/dashboard";
import type { DashboardTeamMemo } from "@/api/generated/dowin.schemas";
import koMessages from "@/messages/ko.json";
import { useToast } from "@/context/ToastContext";
import { createTestQueryClient } from "@/test/render";

import { useTeamMemos } from "./useTeamMemos";

vi.mock("@/api/generated/dashboard/dashboard", () => ({
  getGetWorkspacesWorkspaceIdDashboardTeamMemosQueryKey: vi.fn(
    (workspaceId: string, params: { targetUserId?: number } | undefined) => [
      "team-memos",
      workspaceId,
      params,
    ],
  ),
  useDeleteWorkspacesWorkspaceIdDashboardTeamMemosMemoId: vi.fn(),
  useGetWorkspacesWorkspaceIdDashboardTeamMemos: vi.fn(),
  usePatchWorkspacesWorkspaceIdDashboardTeamMemosMemoIdResolve: vi.fn(),
  usePostWorkspacesWorkspaceIdDashboardTeamMemos: vi.fn(),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

type TeamMemosQueryData = {
  data: {
    workspaceId: string;
    targetUserId: number;
    memos: DashboardTeamMemo[];
  };
  status: 200;
};

const showToast = vi.fn();
const createMutateAsync = vi.fn();
const resolveMutateAsync = vi.fn();
const deleteMutateAsync = vi.fn();

function createMemo(overrides: Partial<DashboardTeamMemo> = {}) {
  return {
    author: {
      avatarKey: "avatar-blue",
      nickname: "홍길동",
      userId: 1,
    },
    content: "기존 메모",
    createdAt: "2026-06-10T00:00:00.000Z",
    id: 10,
    isResolved: false,
    resolvedAt: null,
    resolvedByUserId: null,
    targetUserId: 2,
    workspaceId: "workspace-1",
    ...overrides,
  } satisfies DashboardTeamMemo;
}

function createQueryData(memos: DashboardTeamMemo[]): TeamMemosQueryData {
  return {
    data: {
      memos,
      targetUserId: 2,
      workspaceId: "workspace-1",
    },
    status: 200,
  };
}

function getMemoQueryKey() {
  return getGetWorkspacesWorkspaceIdDashboardTeamMemosQueryKey("workspace-1", {
    targetUserId: 2,
  });
}

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

function renderTeamMemos({
  currentUserId = 1,
  enabled = true,
  queryClient = createTestQueryClient(),
  targetUserId = 2,
}: {
  currentUserId?: number | null;
  enabled?: boolean;
  queryClient?: QueryClient;
  targetUserId?: number | null;
} = {}) {
  return {
    queryClient,
    ...renderHook(
      () =>
        useTeamMemos({
          currentUser: {
            avatarKey: "avatar-blue",
            id: currentUserId,
            nickname: "홍길동",
          },
          enabled,
          targetUserId,
          workspaceId: "workspace-1",
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    ),
  };
}

describe("useTeamMemos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ showToast });
    vi.mocked(useGetWorkspacesWorkspaceIdDashboardTeamMemos).mockReturnValue({
      data: createQueryData([createMemo()]),
      error: undefined,
      isFetching: false,
      isLoading: false,
    } as ReturnType<typeof useGetWorkspacesWorkspaceIdDashboardTeamMemos>);
    vi.mocked(usePostWorkspacesWorkspaceIdDashboardTeamMemos).mockReturnValue({
      isPending: false,
      mutateAsync: createMutateAsync,
    } as unknown as ReturnType<typeof usePostWorkspacesWorkspaceIdDashboardTeamMemos>);
    vi.mocked(
      usePatchWorkspacesWorkspaceIdDashboardTeamMemosMemoIdResolve,
    ).mockReturnValue({
      isPending: false,
      mutateAsync: resolveMutateAsync,
    } as unknown as ReturnType<
      typeof usePatchWorkspacesWorkspaceIdDashboardTeamMemosMemoIdResolve
    >);
    vi.mocked(
      useDeleteWorkspacesWorkspaceIdDashboardTeamMemosMemoId,
    ).mockReturnValue({
      isPending: false,
      mutateAsync: deleteMutateAsync,
    } as unknown as ReturnType<
      typeof useDeleteWorkspacesWorkspaceIdDashboardTeamMemosMemoId
    >);
  });

  it("returns fetched memos and status flags", () => {
    const { result } = renderTeamMemos();

    expect(result.current.memos).toEqual([createMemo()]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("creates a memo with optimistic cache replacement on success", async () => {
    const serverMemo = createMemo({
      content: "새 메모",
      id: 20,
    });
    createMutateAsync.mockResolvedValue({
      data: serverMemo,
      status: 201,
    });
    const { queryClient, result } = renderTeamMemos();

    let isSuccess = false;
    await act(async () => {
      isSuccess = await result.current.createMemo("새 메모");
    });

    expect(isSuccess).toBe(true);
    expect(createMutateAsync).toHaveBeenCalledWith({
      data: {
        content: "새 메모",
        targetUserId: 2,
      },
      workspaceId: "workspace-1",
    });
    expect(
      queryClient.getQueryData<TeamMemosQueryData>(getMemoQueryKey())?.data
        .memos,
    ).toEqual([serverMemo]);
    expect(showToast).not.toHaveBeenCalled();
  });

  it("does not create a memo without a target user or current user", async () => {
    const { result } = renderTeamMemos({ currentUserId: null });

    let isSuccess = true;
    await act(async () => {
      isSuccess = await result.current.createMemo("막아야 하는 메모");
    });

    expect(isSuccess).toBe(false);
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it("rolls back memo creation and shows a toast when create fails", async () => {
    const previousMemo = createMemo();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(getMemoQueryKey(), createQueryData([previousMemo]));
    createMutateAsync.mockRejectedValue({
      response: {
        data: {
          error: {
            message: "메모 저장 실패",
          },
        },
      },
    });
    const { result } = renderTeamMemos({ queryClient });

    let isSuccess = true;
    await act(async () => {
      isSuccess = await result.current.createMemo("실패할 메모");
    });

    expect(isSuccess).toBe(false);
    expect(
      queryClient.getQueryData<TeamMemosQueryData>(getMemoQueryKey())?.data
        .memos,
    ).toEqual([previousMemo]);
    expect(showToast).toHaveBeenCalledWith("error", "메모 저장 실패");
  });

  it("resolves a memo and replaces the optimistic cache item with the server response", async () => {
    const previousMemo = createMemo();
    const resolvedMemo = createMemo({
      isResolved: true,
      resolvedAt: "2026-06-10T01:00:00.000Z",
      resolvedByUserId: 1,
    });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(getMemoQueryKey(), createQueryData([previousMemo]));
    resolveMutateAsync.mockResolvedValue({
      data: resolvedMemo,
      status: 200,
    });
    const { result } = renderTeamMemos({ queryClient });

    let isSuccess = false;
    await act(async () => {
      isSuccess = await result.current.resolveMemo(10, true);
    });

    expect(isSuccess).toBe(true);
    expect(resolveMutateAsync).toHaveBeenCalledWith({
      data: {
        isResolved: true,
      },
      memoId: 10,
      workspaceId: "workspace-1",
    });
    expect(
      queryClient.getQueryData<TeamMemosQueryData>(getMemoQueryKey())?.data
        .memos,
    ).toEqual([resolvedMemo]);
  });

  it("rolls back memo deletion when the delete mutation fails", async () => {
    const previousMemo = createMemo();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(getMemoQueryKey(), createQueryData([previousMemo]));
    deleteMutateAsync.mockResolvedValue({
      data: undefined,
      status: 500,
    });
    const { result } = renderTeamMemos({ queryClient });

    let isSuccess = true;
    await act(async () => {
      isSuccess = await result.current.deleteMemo(10);
    });

    expect(isSuccess).toBe(false);
    expect(deleteMutateAsync).toHaveBeenCalledWith({
      memoId: 10,
      workspaceId: "workspace-1",
    });
    expect(
      queryClient.getQueryData<TeamMemosQueryData>(getMemoQueryKey())?.data
        .memos,
    ).toEqual([previousMemo]);
    expect(showToast).toHaveBeenCalledWith(
      "error",
      "메모를 삭제하지 못했습니다.",
    );
  });
});
