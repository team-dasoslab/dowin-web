import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useGetWorkspacesWorkspaceIdScoreboards,
  useGetWorkspacesWorkspaceIdScoreboardsActive,
  usePostWorkspacesWorkspaceIdScoreboardsIdArchive,
  usePostWorkspacesWorkspaceIdScoreboardsIdReactivate,
} from "@/api/generated/scoreboard/scoreboard";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import koMessages from "@/messages/ko.json";
import { createTestQueryClient } from "@/test/render";

import { useScoreboardArchive } from "./useScoreboardArchive";

vi.mock("@/api/generated/scoreboard/scoreboard", () => ({
  useGetWorkspacesWorkspaceIdScoreboards: vi.fn(),
  useGetWorkspacesWorkspaceIdScoreboardsActive: vi.fn(),
  usePostWorkspacesWorkspaceIdScoreboardsIdArchive: vi.fn(),
  usePostWorkspacesWorkspaceIdScoreboardsIdReactivate: vi.fn(),
}));

vi.mock("@/api/generated/workspace/workspace", () => ({
  useGetWorkspacesMe: vi.fn(),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

const showToast = vi.fn();
const archiveMutateAsync = vi.fn();
const reactivateMutateAsync = vi.fn();

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

function createScoreboard(overrides: Record<string, unknown> = {}) {
  return {
    endDate: null,
    goalName: "분기 매출 1억원 만들기",
    id: 10,
    lagMeasure: "월 매출 3천만원에서 1억원으로",
    startDate: "2026-06-01",
    ...overrides,
  };
}

function createApiError(status: number, message?: string) {
  return {
    response: {
      data: {
        error: {
          message,
        },
      },
      status,
    },
  };
}

function mockWorkspace(overrides: Record<string, unknown> = {}) {
  vi.mocked(useGetWorkspacesMe).mockReturnValue({
    data: {
      data: {
        id: "workspace-1",
        name: "Dowin Team",
      },
      status: 200,
    },
    error: undefined,
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useGetWorkspacesMe>);
}

function mockActiveScoreboard(overrides: Record<string, unknown> = {}) {
  vi.mocked(useGetWorkspacesWorkspaceIdScoreboardsActive).mockReturnValue({
    data: {
      data: createScoreboard(),
      status: 200,
    },
    error: undefined,
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useGetWorkspacesWorkspaceIdScoreboardsActive>);
}

function mockArchivedScoreboards(overrides: Record<string, unknown> = {}) {
  vi.mocked(useGetWorkspacesWorkspaceIdScoreboards).mockReturnValue({
    data: {
      data: [createScoreboard({ id: 20, goalName: "지난 점수판" })],
      status: 200,
    },
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useGetWorkspacesWorkspaceIdScoreboards>);
}

function mockMutations() {
  vi.mocked(usePostWorkspacesWorkspaceIdScoreboardsIdArchive).mockReturnValue({
    isPending: false,
    mutateAsync: archiveMutateAsync,
  } as unknown as ReturnType<
    typeof usePostWorkspacesWorkspaceIdScoreboardsIdArchive
  >);
  vi.mocked(usePostWorkspacesWorkspaceIdScoreboardsIdReactivate).mockReturnValue({
    isPending: false,
    mutateAsync: reactivateMutateAsync,
  } as unknown as ReturnType<
    typeof usePostWorkspacesWorkspaceIdScoreboardsIdReactivate
  >);
}

function renderScoreboardArchive(queryClient = createTestQueryClient()) {
  return {
    queryClient,
    ...renderHook(() => useScoreboardArchive(), {
      wrapper: createWrapper(queryClient),
    }),
  };
}

describe("useScoreboardArchive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ showToast });
    mockWorkspace();
    mockActiveScoreboard();
    mockArchivedScoreboards();
    mockMutations();
  });

  it("returns workspace, active scoreboard, archived scoreboards, and numeric active id", () => {
    const { result } = renderScoreboardArchive();

    expect(result.current.workspace?.id).toBe("workspace-1");
    expect(result.current.activeScoreboard?.goalName).toBe(
      "분기 매출 1억원 만들기",
    );
    expect(result.current.activeScoreboardId).toBe(10);
    expect(result.current.archivedScoreboards).toHaveLength(1);
    expect(result.current.hasNoWorkspace).toBe(false);
    expect(result.current.hasNoActiveScoreboard).toBe(false);
    expect(useGetWorkspacesWorkspaceIdScoreboardsActive).toHaveBeenCalledWith(
      "workspace-1",
      expect.objectContaining({
        query: expect.objectContaining({ enabled: true }),
      }),
    );
  });

  it("does not enable scoreboard queries before the workspace id is available", () => {
    mockWorkspace({
      data: undefined,
      isLoading: true,
    });

    const { result } = renderScoreboardArchive();

    expect(result.current.isLoading).toBe(true);
    expect(useGetWorkspacesWorkspaceIdScoreboardsActive).toHaveBeenCalledWith(
      "",
      expect.objectContaining({
        query: expect.objectContaining({ enabled: false }),
      }),
    );
    expect(useGetWorkspacesWorkspaceIdScoreboards).toHaveBeenCalledWith(
      "",
      expect.objectContaining({
        query: expect.objectContaining({ enabled: false }),
      }),
    );
  });

  it("treats workspace 404 as no-workspace state and active scoreboard 404 as empty active state", () => {
    mockWorkspace({
      data: undefined,
      error: createApiError(404),
    });
    const { result, rerender } = renderScoreboardArchive();

    expect(result.current.hasNoWorkspace).toBe(true);
    expect(result.current.workspace).toBeNull();

    mockWorkspace();
    mockActiveScoreboard({
      data: undefined,
      error: createApiError(404),
    });
    rerender();

    expect(result.current.hasNoActiveScoreboard).toBe(true);
    expect(result.current.activeScoreboard).toBeNull();
    expect(result.current.activeScoreboardId).toBeNull();
  });

  it("archives a scoreboard, invalidates cached queries, and shows a success toast", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    archiveMutateAsync.mockResolvedValue({
      data: createScoreboard(),
      status: 200,
    });
    const { result } = renderScoreboardArchive(queryClient);

    let isSuccess = false;
    await act(async () => {
      isSuccess = await result.current.archive(10);
    });

    expect(isSuccess).toBe(true);
    expect(archiveMutateAsync).toHaveBeenCalledWith({
      id: 10,
      workspaceId: "workspace-1",
    });
    expect(invalidateSpy).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      "success",
      "점수판을 보관했습니다. 새 점수판을 만들 수 있어요.",
    );
    expect(result.current.pendingActionId).toBeNull();
  });

  it("shows the API error message when archiving fails", async () => {
    archiveMutateAsync.mockRejectedValue(
      createApiError(403, "이미 보관된 점수판입니다."),
    );
    const { result } = renderScoreboardArchive();

    let isSuccess = true;
    await act(async () => {
      isSuccess = await result.current.archive(10);
    });

    expect(isSuccess).toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      "error",
      "이미 보관된 점수판입니다.",
    );
    expect(result.current.pendingActionId).toBeNull();
  });

  it("reactivates an archived scoreboard and shows a success toast", async () => {
    reactivateMutateAsync.mockResolvedValue({
      data: createScoreboard({ id: 20 }),
      status: 200,
    });
    const { result } = renderScoreboardArchive();

    let isSuccess = false;
    await act(async () => {
      isSuccess = await result.current.reactivate(20);
    });

    expect(isSuccess).toBe(true);
    expect(reactivateMutateAsync).toHaveBeenCalledWith({
      id: 20,
      workspaceId: "workspace-1",
    });
    expect(showToast).toHaveBeenCalledWith(
      "success",
      "점수판을 다시 활성화했습니다.",
    );
    expect(result.current.pendingActionId).toBeNull();
  });
});
