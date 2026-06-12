import { fireEvent, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeamDashboardMemberRole } from "@/api/generated/dowin.schemas";
import { useToast } from "@/context/ToastContext";
import { renderWithProviders } from "@/test/render";

import { useTeamMemos } from "../_hooks/useTeamMemos";
import { WeeklyTable } from "./WeeklyTable";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ workspaceId: "workspace-1" })),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

vi.mock("../_hooks/useTeamMemos", () => ({
  useTeamMemos: vi.fn(),
}));

vi.mock("./TeamMemberMemoPanel", () => ({
  TeamMemberMemoPanel: ({
    memoMode,
    memos,
  }: {
    memoMode?: "compose" | "view" | null;
    memos: unknown[];
  }) => (
    <section data-testid="memo-panel">
      memo-mode:{memoMode ?? "closed"} memo-count:{memos.length}
    </section>
  ),
}));

type WeeklyTableProps = ComponentProps<typeof WeeklyTable>;

const weekDates = [
  "2026-06-08",
  "2026-06-09",
  "2026-06-10",
  "2026-06-11",
  "2026-06-12",
  "2026-06-13",
  "2026-06-14",
];

const createMemo = vi.fn();
const resolveMemo = vi.fn();
const deleteMemo = vi.fn();
const showToast = vi.fn();

function createMember(
  overrides: Partial<WeeklyTableProps["member"]> = {},
): WeeklyTableProps["member"] {
  return {
    avatarKey: "avatar-blue",
    goalName: "분기 매출 1억원 만들기",
    hasScoreboard: true,
    leadMeasures: [
      {
        achieved: 1,
        id: 1,
        logs: {
          "2026-06-10": {
            achieved: true,
            count: 0,
            value: true,
          },
        },
        name: "잠재고객 10명에게 연락하기",
        period: "WEEKLY",
        targetValue: 3,
        total: 3,
      },
      {
        achieved: 1,
        dailyTargetCount: 3,
        id: 2,
        logs: {
          "2026-06-10": {
            achieved: false,
            count: 2,
            value: true,
          },
        },
        name: "고객 통화 횟수",
        period: "WEEKLY",
        targetValue: 5,
        total: 5,
        trackingMode: "COUNT",
      },
    ],
    nickname: "홍길동",
    role: TeamDashboardMemberRole.MEMBER,
    userId: 1,
    ...overrides,
  };
}

function createMemos() {
  return [
    {
      author: {
        avatarKey: "avatar-green",
        nickname: "관리자",
        userId: 9,
      },
      content: "이번 주 고객 통화 확인",
      createdAt: "2026-06-10T00:00:00.000Z",
      id: 10,
      isResolved: false,
      resolvedAt: null,
      resolvedByUserId: null,
      targetUserId: 1,
      workspaceId: "workspace-1",
    },
  ];
}

function mockTeamMemos(overrides: Partial<ReturnType<typeof useTeamMemos>> = {}) {
  vi.mocked(useTeamMemos).mockReturnValue({
    createMemo,
    deleteMemo,
    isCreatePending: false,
    isDeletePending: false,
    isError: false,
    isFetching: false,
    isLoading: false,
    isResolvePending: false,
    memos: [],
    resolveMemo,
    ...overrides,
  });
}

function renderWeeklyTable(
  overrides: Partial<WeeklyTableProps> = {},
  memberOverrides: Partial<WeeklyTableProps["member"]> = {},
) {
  const props: WeeklyTableProps = {
    currentUserAvatarKey: "avatar-blue",
    currentUserId: 1,
    currentUserNickname: "홍길동",
    currentUserRole: TeamDashboardMemberRole.MEMBER,
    isMe: false,
    member: createMember(memberOverrides),
    weekDates,
    ...overrides,
  };

  return {
    props,
    ...renderWithProviders(<WeeklyTable {...props} />),
  };
}

describe("WeeklyTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ showToast });
    mockTeamMemos();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: "",
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });
  });

  it("renders member identity, weekly lead measures, and log cells", () => {
    renderWeeklyTable();

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getAllByText(/분기 매출 1억원 만들기/).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText("잠재고객 10명에게 연락하기").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("고객 통화 횟수").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1/3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2/3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1/5").length).toBeGreaterThan(0);
  });

  it("renders the current-user badge and memo panel mode", () => {
    renderWeeklyTable({ isMe: true, memoMode: "compose" });

    expect(screen.getByText("나")).toBeInTheDocument();
    expect(screen.getByTestId("memo-panel")).toHaveTextContent(
      "memo-mode:compose",
    );
  });

  it("shows the view memo button only when memos exist", () => {
    mockTeamMemos({ memos: createMemos() });
    const onToggleView = vi.fn();

    renderWeeklyTable({ onToggleView });

    fireEvent.click(screen.getByRole("button", { name: "메모보기" }));

    expect(onToggleView).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("memo-panel")).toHaveTextContent("memo-count:1");
  });

  it("opens desktop compose mode through the parent callback", () => {
    const onToggleCompose = vi.fn();

    renderWeeklyTable({ onToggleCompose });

    fireEvent.click(screen.getByRole("button", { name: "메모하기" }));

    expect(onToggleCompose).toHaveBeenCalledTimes(1);
    expect(createMemo).not.toHaveBeenCalled();
  });

  it("creates a memo through the mobile prompt flow", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: true,
      media: "(max-width: 1599px)",
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    });
    vi.spyOn(window, "prompt").mockReturnValue("  다음 회의에서 확인  ");
    createMemo.mockResolvedValue(true);

    renderWeeklyTable();

    fireEvent.click(screen.getByRole("button", { name: "메모하기" }));

    expect(createMemo).toHaveBeenCalledWith("다음 회의에서 확인");
  });

  it("does not render when the member has no active scoreboard", () => {
    const { container } = renderWeeklyTable({}, { hasScoreboard: false });

    expect(container).toBeEmptyDOMElement();
  });
});
