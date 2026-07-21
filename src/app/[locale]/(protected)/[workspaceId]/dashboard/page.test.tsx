import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { trackEvent } from "@/lib/client/gtag";
import { renderWithProviders } from "@/test/render";

import { DashboardTeamClient } from "./_components/DashboardTeamClient";
import { useScoreboardImageExport } from "./_hooks/useScoreboardImageExport";
import { useTeamDashboard } from "./_hooks/useTeamDashboard";

vi.mock("@/api/generated/profile/profile", () => ({
  useGetUsersMe: vi.fn(),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
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

vi.mock("./_hooks/useScoreboardImageExport", () => ({
  useScoreboardImageExport: vi.fn(),
}));

vi.mock("./_hooks/useTeamDashboard", () => ({
  useTeamDashboard: vi.fn(),
}));

vi.mock("./_components/TeamPeriodControls", () => ({
  TeamPeriodControls: ({
    movePeriod,
    resetToToday,
    setSelectedDate,
    weekLabel,
  }: {
    movePeriod: (direction: -1 | 1) => void;
    resetToToday: () => void;
    setSelectedDate: (value: string) => void;
    weekLabel: string;
  }) => (
    <section data-testid="team-period-controls">
      <span>{weekLabel}</span>
      <button type="button" onClick={() => movePeriod(-1)}>
        previous period
      </button>
      <button type="button" onClick={() => movePeriod(1)}>
        next period
      </button>
      <button type="button" onClick={() => setSelectedDate("2026-06-03")}>
        choose date
      </button>
      <button type="button" onClick={resetToToday}>
        reset period
      </button>
    </section>
  ),
}));

vi.mock("./_components/MemberCard", () => ({
  MemberCard: ({ isMe, member }: { isMe?: boolean; member: { nickname?: string | null } }) => (
    <section data-testid="member-card">
      {member.nickname}
      {isMe ? ":me" : ""}
    </section>
  ),
}));

vi.mock("./_components/WeeklyTable", () => ({
  WeeklyTable: ({
    currentUserRole,
    isMe,
    memoMode,
    member,
    onToggleCompose,
    onToggleView,
    weekDates,
  }: {
    currentUserRole?: string | null;
    isMe?: boolean;
    memoMode?: "compose" | "view" | null;
    member: { nickname?: string | null };
    onToggleCompose?: () => void;
    onToggleView?: () => void;
    weekDates: string[];
  }) => (
    <section data-testid="weekly-table">
      {member.nickname}:{weekDates[0]}:{memoMode ?? "closed"}:{currentUserRole ?? "none"}
      {isMe ? ":me" : ""}
      <button type="button" onClick={onToggleCompose}>
        compose {member.nickname}
      </button>
      <button type="button" onClick={onToggleView}>
        view {member.nickname}
      </button>
    </section>
  ),
}));

vi.mock("./_components/ScoreboardImageCard", () => ({
  ScoreboardImageCard: ({ member }: { member: { nickname?: string | null } }) => (
    <section data-testid="scoreboard-image-card">{member.nickname}</section>
  ),
}));

const movePeriod = vi.fn();
const resetToToday = vi.fn();
const setSelectedDate = vi.fn();
const saveImage = vi.fn();

type TeamDashboardState = ReturnType<typeof useTeamDashboard>;

function createDashboardState(overrides: Partial<TeamDashboardState> = {}): TeamDashboardState {
  return {
    dashboard: {
      members: [
        {
          hasScoreboard: true,
          nickname: "홍길동",
          role: "MEMBER",
          userId: 1,
        },
        {
          hasScoreboard: false,
          nickname: "점수판 없음",
          role: "MEMBER",
          userId: 2,
        },
        {
          hasScoreboard: true,
          nickname: "관리자",
          role: "ADMIN",
          userId: 3,
        },
      ],
      weekStart: "2026-06-08",
      workspaceId: "workspace-1",
      workspaceName: "Dowin Team",
    },
    hasNoWorkspace: false,
    isLoading: false,
    isPeriodLoading: false,
    isPreviousDisabled: false,
    isResetVisible: false,
    movePeriod,
    resetToToday,
    selectedDate: "2026-06-10",
    setSelectedDate,
    today: "2026-06-10",
    weekDates: [
      "2026-06-08",
      "2026-06-09",
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
      "2026-06-13",
      "2026-06-14",
    ],
    weekLabel: "06.08 – 06.14",
    ...overrides,
  } as TeamDashboardState;
}

function mockDashboardState(overrides: Partial<TeamDashboardState> = {}) {
  vi.mocked(useTeamDashboard).mockReturnValue(createDashboardState(overrides));
}

describe("DashboardTeamClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardState();
    vi.mocked(useGetUsersMe).mockReturnValue({
      data: {
        data: {
          avatarKey: "avatar-blue",
          id: 1,
          nickname: "홍길동",
        },
        status: 200,
      },
    } as ReturnType<typeof useGetUsersMe>);
    vi.mocked(useScoreboardImageExport).mockReturnValue({
      exportRef: { current: null },
      isExporting: false,
      isShareSupported: false,
      saveImage,
    });
  });

  it("renders the loading state while the team dashboard is loading", () => {
    mockDashboardState({
      dashboard: null,
      isLoading: true,
    });

    const { container } = renderWithProviders(
      <DashboardTeamClient initialProfile={undefined} initialTeamDashboard={undefined} />,
    );

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders no-workspace actions when the user has no workspace", () => {
    mockDashboardState({
      dashboard: null,
      hasNoWorkspace: true,
    });

    renderWithProviders(
      <DashboardTeamClient initialProfile={undefined} initialTeamDashboard={undefined} />,
    );

    expect(screen.getByText("아직 워크스페이스가 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 워크스페이스 만들기" })).toHaveAttribute(
      "href",
      "/workspace/new",
    );
    expect(screen.getByRole("link", { name: "초대코드로 참가하기" })).toHaveAttribute(
      "href",
      "/workspace/join",
    );
  });

  it("renders setup CTA when no member has an active scoreboard", () => {
    mockDashboardState({
      dashboard: {
        ...createDashboardState().dashboard!,
        members: [
          {
            hasScoreboard: false,
            nickname: "점수판 없음",
            role: "MEMBER",
            userId: 2,
          },
        ],
      },
    });

    renderWithProviders(
      <DashboardTeamClient initialProfile={undefined} initialTeamDashboard={undefined} />,
    );

    expect(screen.getByText("아직 활성화된 점수판이 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 점수판 만들기" })).toHaveAttribute(
      "href",
      "/workspace-1/setup?mode=create",
    );
  });

  it("renders summary cards, weekly tables, and period controls for active members", () => {
    renderWithProviders(
      <DashboardTeamClient initialProfile={undefined} initialTeamDashboard={undefined} />,
    );

    expect(screen.getByText("팀 대시보드")).toBeInTheDocument();
    expect(screen.getByTestId("team-period-controls")).toHaveTextContent("06.08 – 06.14");
    expect(screen.getAllByTestId("member-card")).toHaveLength(3);
    expect(screen.getAllByTestId("weekly-table")).toHaveLength(2);
    expect(screen.getByText("홍길동:me")).toBeInTheDocument();
    expect(screen.getByText(/홍길동:2026-06-08:closed:MEMBER:me/)).toBeInTheDocument();
    expect(screen.getByText(/관리자:2026-06-08:closed:MEMBER/)).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith("dashboard_team_viewed", {
      member_count_bucket: "2_5",
      workspace_id_hash: expect.any(String),
    });
  });

  it("passes period control actions through to the dashboard hook", () => {
    renderWithProviders(
      <DashboardTeamClient initialProfile={undefined} initialTeamDashboard={undefined} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "previous period" }));
    fireEvent.click(screen.getByRole("button", { name: "next period" }));
    fireEvent.click(screen.getByRole("button", { name: "choose date" }));
    fireEvent.click(screen.getByRole("button", { name: "reset period" }));

    expect(movePeriod).toHaveBeenCalledWith(-1);
    expect(movePeriod).toHaveBeenCalledWith(1);
    expect(setSelectedDate).toHaveBeenCalledWith("2026-06-03");
    expect(resetToToday).toHaveBeenCalledTimes(1);
  });

  it("toggles memo mode for a weekly table", () => {
    renderWithProviders(
      <DashboardTeamClient initialProfile={undefined} initialTeamDashboard={undefined} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "compose 홍길동" }));

    expect(screen.getByText(/홍길동:2026-06-08:compose:MEMBER:me/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "compose 홍길동" }));

    expect(screen.getByText(/홍길동:2026-06-08:closed:MEMBER:me/)).toBeInTheDocument();
  });
});
