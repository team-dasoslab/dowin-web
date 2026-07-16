import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useDeleteWorkspacesWorkspaceIdLeadMeasuresId,
  useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures,
  usePostWorkspacesWorkspaceIdLeadMeasuresIdArchive,
  usePostWorkspacesWorkspaceIdLeadMeasuresIdReactivate,
  usePostWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures,
  usePutWorkspacesWorkspaceIdLeadMeasuresId,
} from "@/api/generated/lead-measure/lead-measure";
import {
  useGetWorkspacesWorkspaceIdScoreboardsActive,
  usePostWorkspacesWorkspaceIdScoreboards,
  usePostWorkspacesWorkspaceIdScoreboardsIdArchive,
  usePutWorkspacesWorkspaceIdScoreboardsId,
} from "@/api/generated/scoreboard/scoreboard";
import {
  useDeleteWorkspacesIdTagsTagId,
  useGetWorkspacesIdTags,
  useGetWorkspacesMe,
  usePostWorkspacesIdTags,
  usePutWorkspacesIdTagsTagId,
} from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { trackEvent } from "@/lib/client/gtag";
import koMessages from "@/messages/ko.json";
import { createTestQueryClient } from "@/test/render";

import { useScoreboardSetup } from "./useScoreboardSetup";

vi.mock("@/api/generated/lead-measure/lead-measure", () => ({
  getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasuresQueryKey: vi.fn(
    (workspaceId, scoreboardId, params) => [
      "lead-measures",
      workspaceId,
      scoreboardId,
      params,
    ],
  ),
  useDeleteWorkspacesWorkspaceIdLeadMeasuresId: vi.fn(),
  useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures: vi.fn(),
  usePostWorkspacesWorkspaceIdLeadMeasuresIdArchive: vi.fn(),
  usePostWorkspacesWorkspaceIdLeadMeasuresIdReactivate: vi.fn(),
  usePostWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures: vi.fn(),
  usePutWorkspacesWorkspaceIdLeadMeasuresId: vi.fn(),
}));

vi.mock("@/api/generated/scoreboard/scoreboard", () => ({
  getGetWorkspacesWorkspaceIdScoreboardsActiveQueryKey: vi.fn((workspaceId) => [
    "active-scoreboard",
    workspaceId,
  ]),
  getGetWorkspacesWorkspaceIdScoreboardsQueryKey: vi.fn((workspaceId) => [
    "scoreboards",
    workspaceId,
  ]),
  useGetWorkspacesWorkspaceIdScoreboardsActive: vi.fn(),
  usePostWorkspacesWorkspaceIdScoreboards: vi.fn(),
  usePostWorkspacesWorkspaceIdScoreboardsIdArchive: vi.fn(),
  usePutWorkspacesWorkspaceIdScoreboardsId: vi.fn(),
}));

vi.mock("@/api/generated/workspace/workspace", () => ({
  getGetWorkspacesIdTagsQueryKey: vi.fn((workspaceId) => [
    "workspace-tags",
    workspaceId,
  ]),
  useDeleteWorkspacesIdTagsTagId: vi.fn(),
  useGetWorkspacesIdTags: vi.fn(),
  useGetWorkspacesMe: vi.fn(),
  usePostWorkspacesIdTags: vi.fn(),
  usePutWorkspacesIdTagsTagId: vi.fn(),
}));

const refresh = vi.fn();
const replace = vi.fn();
const searchParamsGet = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    refresh,
    replace,
  })),
  useSearchParams: vi.fn(() => ({
    get: searchParamsGet,
  })),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/lib/client/gtag", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@/lib/client/id-hash", () => ({
  hashId: vi.fn((value: number | null | undefined) => `hash-${value}`),
}));

const showToast = vi.fn();
const createScoreboardMutateAsync = vi.fn();
const createLeadMeasureMutateAsync = vi.fn();
const updateScoreboardMutateAsync = vi.fn();
const archiveScoreboardMutateAsync = vi.fn();
const updateLeadMeasureMutateAsync = vi.fn();
const archiveLeadMeasureMutateAsync = vi.fn();
const reactivateLeadMeasureMutateAsync = vi.fn();
const deleteLeadMeasureMutateAsync = vi.fn();
const createTagMutateAsync = vi.fn();
const updateTagMutateAsync = vi.fn();
const deleteTagMutateAsync = vi.fn();

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

function mockMutation<T extends (...args: never[]) => unknown>(
  hook: T,
  mutateAsync: ReturnType<typeof vi.fn>,
  overrides: Record<string, unknown> = {},
) {
  vi.mocked(hook).mockReturnValue({
    isPending: false,
    mutateAsync,
    ...overrides,
  } as unknown as ReturnType<T>);
}

function mockWorkspace() {
  vi.mocked(useGetWorkspacesMe).mockReturnValue({
    data: {
      data: {
        id: "workspace-1",
        name: "Dowin Team",
      },
      status: 200,
    },
    isLoading: false,
  } as ReturnType<typeof useGetWorkspacesMe>);
}

function mockWorkspaceTags() {
  vi.mocked(useGetWorkspacesIdTags).mockReturnValue({
    data: {
      data: [{ id: 1, name: "영업" }],
      status: 200,
    },
    isLoading: false,
  } as ReturnType<typeof useGetWorkspacesIdTags>);
}

function mockNoActiveScoreboard() {
  vi.mocked(useGetWorkspacesWorkspaceIdScoreboardsActive).mockReturnValue({
    data: undefined,
    error: {
      response: {
        status: 404,
      },
    },
    isLoading: false,
  } as ReturnType<typeof useGetWorkspacesWorkspaceIdScoreboardsActive>);
}

function mockActiveScoreboard() {
  vi.mocked(useGetWorkspacesWorkspaceIdScoreboardsActive).mockReturnValue({
    data: {
      data: {
        goalName: "기존 목표",
        id: 101,
        lagMeasure: "기존 성공 기준",
        startDate: "2026-02-01",
      },
      status: 200,
    },
    error: undefined,
    isLoading: false,
  } as ReturnType<typeof useGetWorkspacesWorkspaceIdScoreboardsActive>);
}

function mockLeadMeasures() {
  vi.mocked(
    useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures,
  ).mockReturnValue({
    data: undefined,
    isLoading: false,
  } as ReturnType<
    typeof useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures
  >);
}

function mockExistingLeadMeasures() {
  vi.mocked(
    useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures,
  ).mockReturnValue({
    data: {
      data: [
        {
          dailyTargetCount: 1,
          id: 11,
          name: "기존 활성 액션",
          period: "WEEKLY",
          status: "ACTIVE",
          tags: [{ id: 1, name: "영업" }],
          targetValue: 3,
          trackingMode: "BOOLEAN",
        },
        {
          dailyTargetCount: 2,
          id: 12,
          name: "기존 보관 액션",
          period: "MONTHLY",
          status: "ARCHIVED",
          tags: [],
          targetValue: 99,
          trackingMode: "COUNT",
        },
      ],
      status: 200,
    },
    isLoading: false,
  } as ReturnType<
    typeof useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures
  >);
}

function mockMutations() {
  mockMutation(
    usePostWorkspacesWorkspaceIdScoreboards,
    createScoreboardMutateAsync,
  );
  mockMutation(
    usePutWorkspacesWorkspaceIdScoreboardsId,
    updateScoreboardMutateAsync,
  );
  mockMutation(
    usePostWorkspacesWorkspaceIdScoreboardsIdArchive,
    archiveScoreboardMutateAsync,
  );
  mockMutation(
    usePostWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures,
    createLeadMeasureMutateAsync,
  );
  mockMutation(
    usePutWorkspacesWorkspaceIdLeadMeasuresId,
    updateLeadMeasureMutateAsync,
  );
  mockMutation(
    usePostWorkspacesWorkspaceIdLeadMeasuresIdArchive,
    archiveLeadMeasureMutateAsync,
  );
  mockMutation(
    usePostWorkspacesWorkspaceIdLeadMeasuresIdReactivate,
    reactivateLeadMeasureMutateAsync,
  );
  mockMutation(
    useDeleteWorkspacesWorkspaceIdLeadMeasuresId,
    deleteLeadMeasureMutateAsync,
  );
  mockMutation(usePostWorkspacesIdTags, createTagMutateAsync);
  mockMutation(usePutWorkspacesIdTagsTagId, updateTagMutateAsync);
  mockMutation(useDeleteWorkspacesIdTagsTagId, deleteTagMutateAsync);
}

function renderScoreboardSetup(queryClient = createTestQueryClient()) {
  return {
    queryClient,
    ...renderHook(() => useScoreboardSetup(), {
      wrapper: createWrapper(queryClient),
    }),
  };
}

describe("useScoreboardSetup create mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsGet.mockReturnValue("create");
    vi.mocked(useToast).mockReturnValue({ showToast });
    mockWorkspace();
    mockWorkspaceTags();
    mockNoActiveScoreboard();
    mockLeadMeasures();
    mockMutations();
    createScoreboardMutateAsync.mockResolvedValue({
      data: {
        id: 101,
      },
      status: 201,
    });
    createLeadMeasureMutateAsync.mockResolvedValue({
      data: {
        id: 201,
      },
      status: 201,
    });
  });

  it("initializes empty create-mode form state", () => {
    const { result } = renderScoreboardSetup();

    expect(result.current.isEditMode).toBe(false);
    expect(result.current.isInitializing).toBe(false);
    expect(result.current.goalName).toBe("");
    expect(result.current.lagMeasure).toBe("");
    expect(result.current.availableTags).toEqual([{ id: 1, name: "영업" }]);
    expect(result.current.measures).toEqual([
      expect.objectContaining({
        dailyTargetCount: 1,
        existingId: null,
        id: expect.any(String),
        name: "",
        period: "WEEKLY",
        status: "ACTIVE",
        targetValue: 3,
        trackingMode: "BOOLEAN",
      }),
    ]);
    expect(
      useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures,
    ).toHaveBeenCalledWith(
      "workspace-1",
      0,
      undefined,
      expect.objectContaining({
        query: expect.objectContaining({
          enabled: false,
        }),
      }),
    );
  });

  it("updates local goal, success criteria, and measure fields with clamped targets", () => {
    const { result } = renderScoreboardSetup();
    const measureId = result.current.measures[0]?.id ?? "";

    act(() => {
      result.current.setGoalName("신규 목표");
      result.current.setLagMeasure("신규 성공 기준");
      result.current.handleMeasureChange(
        measureId,
        "name",
        "신규 액션 아이템",
      );
      result.current.handleMeasureChange(measureId, "targetValue", 9);
      result.current.handleMeasureChange(measureId, "period", "MONTHLY");
      result.current.handleMeasureChange(measureId, "targetValue", 99);
      result.current.handleMeasureChange(
        measureId,
        "trackingMode",
        "COUNT",
      );
      result.current.handleMeasureChange(
        measureId,
        "dailyTargetCount",
        4,
      );
    });

    expect(result.current.goalName).toBe("신규 목표");
    expect(result.current.lagMeasure).toBe("신규 성공 기준");
    expect(result.current.measures[0]).toEqual(
      expect.objectContaining({
        dailyTargetCount: 4,
        name: "신규 액션 아이템",
        period: "MONTHLY",
        targetValue: 31,
        trackingMode: "COUNT",
      }),
    );
  });

  it("adds and removes unsaved measure rows without removing the last active row", () => {
    const { result } = renderScoreboardSetup();
    const firstMeasureId = result.current.measures[0]?.id ?? "";

    act(() => {
      result.current.removeMeasureRow(firstMeasureId);
    });
    expect(result.current.measures).toHaveLength(1);

    act(() => {
      result.current.addMeasureRow();
    });
    expect(result.current.measures).toHaveLength(2);

    act(() => {
      result.current.removeMeasureRow(firstMeasureId);
    });

    expect(result.current.measures).toHaveLength(1);
  });

  it("validates required fields before submitting", async () => {
    const { result } = renderScoreboardSetup();
    let submitResult = true;

    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult).toBe(false);
    expect(createScoreboardMutateAsync).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      "error",
      "핵심 목표, 성공 기준, 그리고 최소 하나의 액션 아이템을 입력해주세요.",
    );
  });

  it("creates a scoreboard, creates active lead measures, tracks events, and shows a success toast", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderScoreboardSetup(queryClient);
    const measureId = result.current.measures[0]?.id ?? "";
    let submitResult = false;

    act(() => {
      result.current.setGoalName("분기 매출 1억원 만들기");
      result.current.setLagMeasure("월 매출 3천만원에서 1억원으로");
      result.current.handleMeasureChange(
        measureId,
        "name",
        "잠재고객 10명에게 연락하기",
      );
      result.current.handleMeasureChange(measureId, "targetValue", 3);
      result.current.handleMeasureChange(
        measureId,
        "trackingMode",
        "COUNT",
      );
      result.current.handleMeasureChange(
        measureId,
        "dailyTargetCount",
        2,
      );
      result.current.toggleMeasureTag(measureId, {
        id: 1,
        name: "영업",
      });
    });

    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult).toBe(true);
    expect(createScoreboardMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      data: expect.objectContaining({
        goalName: "분기 매출 1억원 만들기",
        lagMeasure: "월 매출 3천만원에서 1억원으로",
      }),
    });
    expect(createLeadMeasureMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      scoreboardId: 101,
      data: {
        dailyTargetCount: 2,
        name: "잠재고객 10명에게 연락하기",
        period: "WEEKLY",
        tagIds: [1],
        targetValue: 3,
        trackingMode: "COUNT",
        orderIndex: expect.any(Number),
      },
    });
    expect(trackEvent).toHaveBeenCalledWith("scoreboard_created", {
      lead_measure_count: 1,
      workspace_id_hash: "workspace-1",
    });
    expect(trackEvent).toHaveBeenCalledWith("lead_measure_created", {
      lead_measure_id_hash: "hash-201",
      period_type: "WEEKLY",
      scoreboard_id_hash: "hash-101",
    });
    expect(showToast).toHaveBeenCalledWith(
      "success",
      "새 점수판을 만들었습니다.",
    );
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["active-scoreboard", "workspace-1"],
      });
    });
  });
});

describe("useScoreboardSetup update mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsGet.mockReturnValue("update");
    vi.mocked(useToast).mockReturnValue({ showToast });
    mockWorkspace();
    mockWorkspaceTags();
    mockActiveScoreboard();
    mockExistingLeadMeasures();
    mockMutations();
    createLeadMeasureMutateAsync.mockResolvedValue({
      data: {
        id: 301,
      },
      status: 201,
    });
    updateScoreboardMutateAsync.mockResolvedValue({
      data: {
        id: 101,
      },
      status: 200,
    });
    updateLeadMeasureMutateAsync.mockResolvedValue({
      status: 200,
    });
    archiveLeadMeasureMutateAsync.mockResolvedValue({
      status: 200,
    });
    reactivateLeadMeasureMutateAsync.mockResolvedValue({
      status: 200,
    });
  });

  it("initializes edit-mode state from the active scoreboard and lead measures", async () => {
    const { result } = renderScoreboardSetup();

    await waitFor(() => {
      expect(result.current.goalName).toBe("기존 목표");
    });

    expect(result.current.isEditMode).toBe(true);
    expect(result.current.lagMeasure).toBe("기존 성공 기준");
    expect(result.current.monthlyTargetMax).toBe(28);
    expect(result.current.measures).toEqual([
      expect.objectContaining({
        id: "11",
        existingId: 11,
        dailyTargetCount: 1,
        tags: [{ id: 1, name: "영업" }],
        initialPayload: expect.objectContaining({
          dailyTargetCount: 1,
          name: "기존 활성 액션",
          period: "WEEKLY",
          tagIds: [1],
          targetValue: 3,
          trackingMode: "BOOLEAN",
          orderIndex: 0,
        }),
        initialStatus: "ACTIVE",
        name: "기존 활성 액션",
        period: "WEEKLY",
        status: "ACTIVE",
        targetValue: 3,
        trackingMode: "BOOLEAN",
      }),
      expect.objectContaining({
        id: "12",
        dailyTargetCount: 2,
        existingId: 12,
        tags: [],
        initialStatus: "ARCHIVED",
        name: "기존 보관 액션",
        period: "MONTHLY",
        status: "ARCHIVED",
        targetValue: 28,
        trackingMode: "COUNT",
      }),
    ]);
    expect(
      useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures,
    ).toHaveBeenCalledWith(
      "workspace-1",
      101,
      { status: "all" },
      expect.objectContaining({
        query: expect.objectContaining({
          enabled: true,
        }),
      }),
    );
  });

  it("does not update unchanged existing lead measures", async () => {
    const { result } = renderScoreboardSetup();
    let submitResult = false;

    await waitFor(() => {
      expect(result.current.measures).toHaveLength(2);
    });

    act(() => {
      result.current.setGoalName("수정 목표");
    });

    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult).toBe(true);
    expect(updateScoreboardMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      id: 101,
      data: {
        goalName: "수정 목표",
        lagMeasure: "기존 성공 기준",
      },
    });
    expect(updateLeadMeasureMutateAsync).not.toHaveBeenCalled();
    expect(createLeadMeasureMutateAsync).not.toHaveBeenCalled();
    expect(reactivateLeadMeasureMutateAsync).not.toHaveBeenCalled();
    expect(archiveLeadMeasureMutateAsync).not.toHaveBeenCalled();
    expect(deleteLeadMeasureMutateAsync).not.toHaveBeenCalled();
  });

  it("does not update an unchanged scoreboard when a lead measure changes", async () => {
    const { result } = renderScoreboardSetup();
    let submitResult = false;

    await waitFor(() => {
      expect(result.current.measures).toHaveLength(2);
    });

    act(() => {
      result.current.handleMeasureChange("11", "name", "수정 활성 액션");
    });

    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult).toBe(true);
    expect(updateScoreboardMutateAsync).not.toHaveBeenCalled();
    expect(updateLeadMeasureMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      id: 11,
      data: {
        dailyTargetCount: 1,
        name: "수정 활성 액션",
        period: "WEEKLY",
        tagIds: [1],
        targetValue: 3,
        trackingMode: "BOOLEAN",
        orderIndex: expect.any(Number),
      },
    });
    expect(createLeadMeasureMutateAsync).not.toHaveBeenCalled();
    expect(reactivateLeadMeasureMutateAsync).not.toHaveBeenCalled();
    expect(archiveLeadMeasureMutateAsync).not.toHaveBeenCalled();
    expect(deleteLeadMeasureMutateAsync).not.toHaveBeenCalled();
  });

  it("does not call update APIs when the edit form is unchanged", async () => {
    const { result } = renderScoreboardSetup();
    let submitResult = false;

    await waitFor(() => {
      expect(result.current.measures).toHaveLength(2);
    });

    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult).toBe(true);
    expect(updateScoreboardMutateAsync).not.toHaveBeenCalled();
    expect(updateLeadMeasureMutateAsync).not.toHaveBeenCalled();
    expect(createLeadMeasureMutateAsync).not.toHaveBeenCalled();
    expect(reactivateLeadMeasureMutateAsync).not.toHaveBeenCalled();
    expect(archiveLeadMeasureMutateAsync).not.toHaveBeenCalled();
    expect(deleteLeadMeasureMutateAsync).not.toHaveBeenCalled();
  });

  it("marks existing rows for archive, reactivation, delete, and restore locally", async () => {
    const { result } = renderScoreboardSetup();

    await waitFor(() => {
      expect(result.current.measures).toHaveLength(2);
    });

    act(() => {
      result.current.archiveMeasureRow("11");
      result.current.reactivateMeasureRow("12");
      result.current.removeMeasureRow("11");
    });

    expect(result.current.measures).toEqual([
      expect.objectContaining({
        existingId: 11,
        isDeleted: true,
        status: "ARCHIVED",
      }),
      expect.objectContaining({
        existingId: 12,
        status: "ACTIVE",
      }),
    ]);

    act(() => {
      result.current.restoreMeasureRow("11");
    });

    expect(result.current.measures[0]).toEqual(
      expect.objectContaining({
        existingId: 11,
        isDeleted: false,
      }),
    );
  });

  it("updates scoreboard and reconciles existing, new, and archived lead measures", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderScoreboardSetup(queryClient);
    let submitResult = false;

    await waitFor(() => {
      expect(result.current.measures).toHaveLength(2);
    });

    act(() => {
      result.current.setGoalName("수정 목표");
      result.current.setLagMeasure("수정 성공 기준");
      result.current.archiveMeasureRow("11");
      result.current.reactivateMeasureRow("12");
      result.current.handleMeasureChange("12", "name", "재활성화 액션");
      result.current.addMeasureRow();
    });

    const newMeasureId =
      result.current.measures.find((measure) => measure.existingId === null)
        ?.id ?? "";

    act(() => {
      result.current.handleMeasureChange(newMeasureId, "name", "신규 액션");
      result.current.handleMeasureChange(newMeasureId, "period", "MONTHLY");
      result.current.handleMeasureChange(newMeasureId, "targetValue", 4);
    });

    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult).toBe(true);
    expect(updateScoreboardMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      id: 101,
      data: {
        goalName: "수정 목표",
        lagMeasure: "수정 성공 기준",
      },
    });
    expect(reactivateLeadMeasureMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      id: 12,
    });
    expect(updateLeadMeasureMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      id: 12,
      data: {
        dailyTargetCount: 2,
        name: "재활성화 액션",
        period: "MONTHLY",
        tagIds: [],
        targetValue: 28,
        trackingMode: "COUNT",
        orderIndex: expect.any(Number),
      },
    });
    expect(createLeadMeasureMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      scoreboardId: 101,
      data: {
        dailyTargetCount: 1,
        name: "신규 액션",
        period: "MONTHLY",
        tagIds: [],
        targetValue: 4,
        trackingMode: "BOOLEAN",
        orderIndex: expect.any(Number),
      },
    });
    expect(archiveLeadMeasureMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      id: 11,
    });
    expect(showToast).toHaveBeenCalledWith("success", "점수판을 저장했습니다.");
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["active-scoreboard", "workspace-1"],
      });
    });
  });
});
