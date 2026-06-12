import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGetWorkspacesWorkspaceIdDashboardTeam } from "@/api/generated/dashboard/dashboard";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";

import { useTeamDashboard } from "./useTeamDashboard";

vi.mock("@/api/generated/dashboard/dashboard", () => ({
  useGetWorkspacesWorkspaceIdDashboardTeam: vi.fn(),
}));

vi.mock("@/api/generated/workspace/workspace", () => ({
  useGetWorkspacesMe: vi.fn(),
}));

type DashboardQueryResult = ReturnType<
  typeof useGetWorkspacesWorkspaceIdDashboardTeam
>;
type WorkspaceQueryResult = ReturnType<typeof useGetWorkspacesMe>;

function createDashboardResponse(weekStart = "2026-06-08") {
  return {
    members: [],
    weekStart,
    workspaceId: "workspace-1",
    workspaceName: "Dowin Team",
  };
}

function mockWorkspaceQuery(overrides: Partial<WorkspaceQueryResult> = {}) {
  vi.mocked(useGetWorkspacesMe).mockReturnValue({
    error: undefined,
    ...overrides,
  } as WorkspaceQueryResult);
}

function mockDashboardQuery(overrides: Partial<DashboardQueryResult> = {}) {
  vi.mocked(useGetWorkspacesWorkspaceIdDashboardTeam).mockReturnValue({
    data: {
      data: createDashboardResponse(),
      status: 200,
    },
    error: undefined,
    isFetching: false,
    isLoading: false,
    ...overrides,
  } as DashboardQueryResult);
}

function createApiError(status: number) {
  return {
    response: {
      status,
    },
  };
}

describe("useTeamDashboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-09T15:00:00.000Z"));
    mockWorkspaceQuery();
    mockDashboardQuery();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("loads the current KST week and formats week dates from dashboard data", async () => {
    const { result } = renderHook(() => useTeamDashboard("workspace-1"));

    expect(result.current.dashboard?.weekStart).toBe("2026-06-08");
    expect(result.current.today).toBe("2026-06-10");
    expect(result.current.selectedDate).toBe("2026-06-10");
    expect(result.current.weekDates).toEqual([
      "2026-06-08",
      "2026-06-09",
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
      "2026-06-13",
      "2026-06-14",
    ]);
    expect(result.current.weekLabel).toBe("06.08 – 06.14");
    expect(result.current.isResetVisible).toBe(false);
    expect(useGetWorkspacesWorkspaceIdDashboardTeam).toHaveBeenLastCalledWith(
      "workspace-1",
      { weekStart: "2026-06-08" },
      expect.any(Object),
    );
  });

  it("normalizes selected dates to their week start and ignores invalid dates", () => {
    const { result } = renderHook(() => useTeamDashboard("workspace-1"));

    act(() => {
      result.current.setSelectedDate("not-a-date");
    });

    expect(result.current.selectedDate).toBe("2026-06-10");

    act(() => {
      result.current.setSelectedDate("2026-06-17");
    });

    expect(result.current.selectedDate).toBe("2026-06-15");
    expect(result.current.isResetVisible).toBe(true);
    expect(useGetWorkspacesWorkspaceIdDashboardTeam).toHaveBeenLastCalledWith(
      "workspace-1",
      { weekStart: "2026-06-15" },
      expect.any(Object),
    );
  });

  it("moves by full weeks and can reset back to today", () => {
    const { result } = renderHook(() => useTeamDashboard("workspace-1"));

    act(() => {
      result.current.movePeriod(-1);
    });
    expect(result.current.selectedDate).toBe("2026-06-01");
    expect(result.current.isResetVisible).toBe(true);

    act(() => {
      result.current.movePeriod(1);
    });
    expect(result.current.selectedDate).toBe("2026-06-08");

    act(() => {
      result.current.resetToToday();
    });
    expect(result.current.selectedDate).toBe("2026-06-10");
    expect(result.current.isResetVisible).toBe(false);
  });

  it("keeps the last successful dashboard while a later request is fetching", async () => {
    const { rerender, result } = renderHook(() =>
      useTeamDashboard("workspace-1"),
    );

    expect(result.current.dashboard?.workspaceName).toBe("Dowin Team");

    mockDashboardQuery({
      data: undefined,
      isFetching: true,
    });
    rerender();

    expect(result.current.dashboard?.workspaceName).toBe("Dowin Team");
    expect(result.current.isPeriodLoading).toBe(true);
  });

  it("treats dashboard or workspace 404 responses as no-workspace state", () => {
    mockDashboardQuery({
      data: undefined,
      error: createApiError(404),
    });

    const { result, rerender } = renderHook(() =>
      useTeamDashboard("workspace-1"),
    );

    expect(result.current.hasNoWorkspace).toBe(true);

    mockDashboardQuery({
      data: undefined,
      error: undefined,
    });
    mockWorkspaceQuery({
      error: createApiError(404),
    });
    rerender();

    expect(result.current.hasNoWorkspace).toBe(true);
  });
});
