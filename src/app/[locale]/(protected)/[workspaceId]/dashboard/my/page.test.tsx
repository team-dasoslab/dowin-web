import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import MyDashboardPage from "./page";
import { useDashboardScoreboard } from "./_hooks/useDashboardScoreboard";
import { useMyDashboardPageState } from "./_hooks/useMyDashboardPageState";
import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useToast } from "@/context/ToastContext";

vi.mock("@/api/generated/profile/profile", () => ({
  useGetUsersMe: vi.fn(),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ workspaceId: "workspace-1" })),
}));

vi.mock("@/lib/client/gtag", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("./_hooks/useDashboardScoreboard", () => ({
  useDashboardScoreboard: vi.fn(),
}));

vi.mock("./_hooks/useLoginPushPrompt", () => ({
  useLoginPushPrompt: vi.fn(),
}));

vi.mock("./_hooks/useMyDashboardPageState", () => ({
  useMyDashboardPageState: vi.fn(),
}));

vi.mock("./_components/ScoreboardOverviewSection", () => ({
  ScoreboardOverviewSection: ({
    monthlyOverallRate,
    weeklyOverallRate,
  }: {
    monthlyOverallRate: number;
    weeklyOverallRate: number;
  }) => (
    <section data-testid="scoreboard-overview">
      weekly:{weeklyOverallRate} monthly:{monthlyOverallRate}
    </section>
  ),
}));

vi.mock("./_components/PeriodControls", () => ({
  PeriodControls: ({
    movePeriod,
    resetToToday,
    selectedView,
    weekLabel,
    monthLabel,
  }: {
    movePeriod: (direction: -1 | 1) => void;
    resetToToday: () => void;
    selectedView: "week" | "month";
    weekLabel: string;
    monthLabel?: string;
  }) => (
    <section data-testid="period-controls">
      <span>{selectedView === "week" ? weekLabel : monthLabel}</span>
      <button type="button" onClick={() => movePeriod(-1)}>
        previous period
      </button>
      <button type="button" onClick={() => movePeriod(1)}>
        next period
      </button>
      <button type="button" onClick={resetToToday}>
        reset period
      </button>
    </section>
  ),
}));

vi.mock("./_components/WeeklyBoardSection", () => ({
  WeeklyBoardSection: ({
    activeLeadMeasures,
    onBeforeToggle,
    toggleLog,
    weekDates,
  }: {
    activeLeadMeasures: Array<{ id?: number | string; name?: string | null }>;
    onBeforeToggle: () => void;
    toggleLog: (leadMeasureId: number, date: string) => void;
    weekDates: string[];
  }) => (
    <section data-testid="weekly-board">
      {activeLeadMeasures.map((measure) => (
        <button
          key={measure.id}
          type="button"
          onClick={() => {
            onBeforeToggle();
            toggleLog(Number(measure.id), weekDates[0]);
          }}
        >
          {measure.name}
        </button>
      ))}
    </section>
  ),
}));

vi.mock("./_components/MonthlyBoardSection", () => ({
  MonthlyBoardSection: ({
    monthlyLeadMeasures,
  }: {
    monthlyLeadMeasures: Array<{ id?: number | string; name?: string | null }>;
  }) => (
    <section data-testid="monthly-board">
      {monthlyLeadMeasures.map((measure) => (
        <span key={measure.id}>{measure.name}</span>
      ))}
    </section>
  ),
}));

vi.mock("./_components/ProductUpdateCard", () => ({
  ProductUpdateCard: ({
    onDismiss,
    update,
  }: {
    onDismiss: () => void;
    update: { title: string };
  }) => (
    <section data-testid="product-update">
      <span>{update.title}</span>
      <button type="button" onClick={onDismiss}>
        dismiss update
      </button>
    </section>
  ),
}));

vi.mock("@/app/[locale]/(protected)/_components/WorkspaceOverLimitBanner", () => ({
  WorkspaceOverLimitBanner: () => (
    <section data-testid="workspace-over-limit">over limit</section>
  ),
}));

const showToast = vi.fn();
const setSelectedView = vi.fn();
const setSelectedDate = vi.fn();
const movePeriod = vi.fn();
const resetToToday = vi.fn();
const toggleLog = vi.fn();
const markCelebrationPending = vi.fn();
const handleDismissProductUpdate = vi.fn();

type DashboardState = ReturnType<typeof useDashboardScoreboard>;

function createBaseDashboardState(): DashboardState {
  return {
    activeLeadMeasures: [
      {
        id: 1,
        name: "잠재고객 10명에게 연락하기",
        period: "WEEKLY",
        targetValue: 3,
        tags: [],
      },
    ],
    activeScoreboard: {
      goalName: "분기 매출 1억원 만들기",
      id: 10,
      lagMeasure: "월 매출 3천만원에서 1억원으로",
    },
    hasNoScoreboard: false,
    hasNoWorkspace: false,
    isLoading: false,
    isLogPending: false,
    isMonthlyLogsLoading: false,
    isPeriodLoading: false,
    isPreviousDisabled: false,
    isWeeklyLogsLoading: false,
    isWeeklyTrendLoading: false,
    monthLabel: "2026년 6월",
    monthlyLeadMeasures: [
      {
        id: 2,
        name: "월간 회고 작성하기",
        period: "MONTHLY",
        targetValue: 1,
      },
    ],
    monthlyOverallRate: 80,
    monthlySummary: undefined,
    movePeriod,
    pendingLogKeys: new Set<string>(),
    resetToToday,
    selectedDate: "2026-06-08",
    selectedView: "week",
    setSelectedDate,
    setSelectedView,
    today: "2026-06-10",
    toggleLog,
    weekDates: [
      "2026-06-08",
      "2026-06-09",
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
      "2026-06-13",
      "2026-06-14",
    ],
    weekLabel: "2026.06.08 - 06.14",
    weeklyById: new Map([[1, { achieved: 1, total: 3, logs: {} }]]),
    weeklyGuideById: new Map(),
    weeklyOverallRate: 33,
    weeklyTrendPoints: [],
    scoreboardError: null,
    workspace: {
      freeMemberLimit: 3,
      id: "workspace-1",
      isOverFreeMemberLimit: false,
      memberCount: 2,
    },
    workspaceError: null,
  } as unknown as DashboardState;
}

function createDashboardState(overrides: Partial<DashboardState> = {}) {
  return {
    ...createBaseDashboardState(),
    ...overrides,
  } as DashboardState;
}

describe("MyDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ showToast });
    vi.mocked(useGetUsersMe).mockReturnValue({
      data: {
        status: 200,
        data: {
          nickname: "혜빈",
          role: "ADMIN",
        },
      },
      isLoading: false,
    } as ReturnType<typeof useGetUsersMe>);
    vi.mocked(useMyDashboardPageState).mockReturnValue({
      celebrationLevel: null,
      handleDismissProductUpdate,
      isUpdateCardVisible: false,
      latestMajorUpdate: null,
      markCelebrationPending,
    } as unknown as ReturnType<typeof useMyDashboardPageState>);
    vi.mocked(useDashboardScoreboard).mockReturnValue(createDashboardState());
  });

  it("renders the loading dashboard skeleton", () => {
    vi.mocked(useDashboardScoreboard).mockReturnValue(
      createDashboardState({ isLoading: true }),
    );

    const { container } = renderWithProviders(<MyDashboardPage />);

    expect(container.querySelectorAll(".bg-border").length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByTestId("weekly-board")).not.toBeInTheDocument();
  });

  it("renders the no-workspace state", () => {
    vi.mocked(useDashboardScoreboard).mockReturnValue(
      createDashboardState({ hasNoWorkspace: true }),
    );

    renderWithProviders(<MyDashboardPage />);

    expect(screen.getByText("아직 워크스페이스가 없습니다")).toBeInTheDocument();
  });

  it("renders the no-scoreboard state with setup link", () => {
    vi.mocked(useDashboardScoreboard).mockReturnValue(
      createDashboardState({
        activeScoreboard: null,
        hasNoScoreboard: true,
      }),
    );

    renderWithProviders(<MyDashboardPage />);

    expect(
      screen.getByText("아직 활성화된 점수판이 없습니다"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 점수판 만들기" }))
      .toHaveAttribute("href", "/workspace-1/setup?mode=create");
  });

  it("renders the weekly dashboard and wires primary controls", () => {
    renderWithProviders(<MyDashboardPage />);

    expect(screen.getByRole("heading", { name: "혜빈님의 홈" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "점수판 보관함" }))
      .toHaveAttribute("href", "/workspace-1/scoreboards");
    expect(screen.getByRole("link", { name: "점수판 관리" }))
      .toHaveAttribute("href", "/workspace-1/setup?mode=update");
    expect(screen.getByTestId("scoreboard-overview")).toHaveTextContent(
      "weekly:33 monthly:80",
    );
    expect(screen.getByTestId("weekly-board")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "월간" }));
    fireEvent.click(screen.getByRole("button", { name: "previous period" }));
    fireEvent.click(
      screen.getByRole("button", { name: "잠재고객 10명에게 연락하기" }),
    );

    expect(setSelectedView).toHaveBeenCalledWith("month");
    expect(movePeriod).toHaveBeenCalledWith(-1);
    expect(markCelebrationPending).toHaveBeenCalledTimes(1);
    expect(toggleLog).toHaveBeenCalledWith(1, "2026-06-08");
  });

  it("renders monthly board for month view", () => {
    vi.mocked(useDashboardScoreboard).mockReturnValue(
      createDashboardState({ selectedView: "month" }),
    );

    renderWithProviders(<MyDashboardPage />);

    expect(screen.getByTestId("monthly-board")).toBeInTheDocument();
    expect(screen.getByText("월간 회고 작성하기")).toBeInTheDocument();
  });

  it("renders empty active-measures state", () => {
    vi.mocked(useDashboardScoreboard).mockReturnValue(
      createDashboardState({ activeLeadMeasures: [] }),
    );

    renderWithProviders(<MyDashboardPage />);

    expect(
      screen.getByText("활성화된 액션 아이템이 없습니다."),
    ).toBeInTheDocument();
  });

  it("renders over-limit and product update states", () => {
    vi.mocked(useDashboardScoreboard).mockReturnValue(
      createDashboardState({
        workspace: {
          freeMemberLimit: 3,
          id: "workspace-1",
          isOverFreeMemberLimit: true,
          memberCount: 5,
          name: "Workspace",
          planCode: "BASIC",
          role: "ADMIN",
        },
      }),
    );
    vi.mocked(useMyDashboardPageState).mockReturnValue({
      celebrationLevel: "single",
      handleDismissProductUpdate,
      isUpdateCardVisible: true,
      latestMajorUpdate: { title: "새 기능 안내" },
      markCelebrationPending,
    } as unknown as ReturnType<typeof useMyDashboardPageState>);

    renderWithProviders(<MyDashboardPage />);

    expect(screen.getByTestId("workspace-over-limit")).toBeInTheDocument();
    expect(screen.getByTestId("product-update")).toHaveTextContent(
      "새 기능 안내",
    );

    fireEvent.click(screen.getByRole("button", { name: "dismiss update" }));
    expect(handleDismissProductUpdate).toHaveBeenCalledTimes(1);
  });
});
