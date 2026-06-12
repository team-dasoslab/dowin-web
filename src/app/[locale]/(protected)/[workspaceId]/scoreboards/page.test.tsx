import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import ScoreboardsPage from "./page";
import { useScoreboardArchive } from "./_hooks/useScoreboardArchive";

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

vi.mock("./_hooks/useScoreboardArchive", () => ({
  useScoreboardArchive: vi.fn(),
}));

vi.mock("./_components/ActiveScoreboardSection", () => ({
  ActiveScoreboardSection: ({
    activeScoreboard,
    activeScoreboardId,
    onArchive,
    pendingActionId,
  }: {
    activeScoreboard: { goalName?: string | null } | null;
    activeScoreboardId: number | null;
    onArchive: (id: number) => void;
    pendingActionId: number | null;
  }) => (
    <section data-testid="active-scoreboard-section">
      {activeScoreboard?.goalName ?? "no-active"}:{pendingActionId ?? "none"}
      {activeScoreboardId != null ? (
        <button type="button" onClick={() => onArchive(activeScoreboardId)}>
          archive active
        </button>
      ) : null}
    </section>
  ),
}));

vi.mock("./_components/ArchivedScoreboardsSection", () => ({
  ArchivedScoreboardsSection: ({
    archivedScoreboards,
    onReactivate,
    pendingActionId,
  }: {
    archivedScoreboards: Array<{ goalName?: string | null; id?: number | null }>;
    onReactivate: (id: number) => void;
    pendingActionId: number | null;
  }) => (
    <section data-testid="archived-scoreboards-section">
      archived:{archivedScoreboards.length}:{pendingActionId ?? "none"}
      {archivedScoreboards.map((scoreboard) => (
        <button
          key={scoreboard.id ?? scoreboard.goalName}
          type="button"
          onClick={() => {
            if (scoreboard.id != null) {
              onReactivate(scoreboard.id);
            }
          }}
        >
          reactivate {scoreboard.goalName}
        </button>
      ))}
    </section>
  ),
}));

const archive = vi.fn();
const reactivate = vi.fn();

type ScoreboardArchiveState = ReturnType<typeof useScoreboardArchive>;

function createArchiveState(
  overrides: Partial<ScoreboardArchiveState> = {},
): ScoreboardArchiveState {
  return {
    activeScoreboard: {
      endDate: null,
      goalName: "분기 매출 1억원 만들기",
      id: 10,
      lagMeasure: "월 매출 3천만원에서 1억원으로",
      startDate: "2026-06-01",
    },
    activeScoreboardId: 10,
    archive,
    archivedScoreboards: [
      {
        endDate: "2026-05-31",
        goalName: "지난 점수판",
        id: 20,
        lagMeasure: "지난 성공 기준",
        startDate: "2026-05-01",
      },
    ],
    hasNoActiveScoreboard: false,
    hasNoWorkspace: false,
    isLoading: false,
    pendingActionId: null,
    reactivate,
    workspace: {
      id: "workspace-1",
      name: "Dowin Team",
    },
    ...overrides,
  } as ScoreboardArchiveState;
}

function mockArchiveState(overrides: Partial<ScoreboardArchiveState> = {}) {
  vi.mocked(useScoreboardArchive).mockReturnValue(createArchiveState(overrides));
}

describe("ScoreboardsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockArchiveState();
  });

  it("renders the loading skeleton while archive data is loading", () => {
    mockArchiveState({
      isLoading: true,
    });

    const { container } = renderWithProviders(<ScoreboardsPage />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders no-workspace state with workspace actions", () => {
    mockArchiveState({
      hasNoWorkspace: true,
      isLoading: false,
    });

    renderWithProviders(<ScoreboardsPage />);

    expect(screen.getByText("아직 워크스페이스가 없습니다")).toBeInTheDocument();
    expect(
      screen.getByText(
        "점수판 보관함은 워크스페이스에 소속된 뒤부터 사용할 수 있습니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 워크스페이스 만들기" })).toHaveAttribute(
      "href",
      "/workspace/new",
    );
    expect(screen.getByRole("link", { name: "초대코드로 참가하기" })).toHaveAttribute(
      "href",
      "/workspace/join",
    );
  });

  it("renders active and archived sections with total count", () => {
    renderWithProviders(<ScoreboardsPage />);

    expect(screen.getByText("점수판 보관함")).toBeInTheDocument();
    expect(screen.getAllByText("현재 활성 점수판").length).toBeGreaterThan(0);
    expect(screen.getAllByText("보관된 점수판").length).toBeGreaterThan(0);
    expect(screen.getByText("총 1개")).toBeInTheDocument();
    expect(screen.getByTestId("active-scoreboard-section")).toHaveTextContent(
      "분기 매출 1억원 만들기:none",
    );
    expect(screen.getByTestId("archived-scoreboards-section")).toHaveTextContent(
      "archived:1:none",
    );
  });

  it("passes archive and reactivate actions to child sections", () => {
    renderWithProviders(<ScoreboardsPage />);

    fireEvent.click(screen.getByRole("button", { name: "archive active" }));
    fireEvent.click(
      screen.getByRole("button", { name: "reactivate 지난 점수판" }),
    );

    expect(archive).toHaveBeenCalledWith(10);
    expect(reactivate).toHaveBeenCalledWith(20);
  });

  it("renders a status-changing overlay while an action is pending", () => {
    mockArchiveState({
      pendingActionId: 20,
    });

    renderWithProviders(<ScoreboardsPage />);

    expect(
      screen.getByText("점수판 상태를 변경하는 중입니다."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("active-scoreboard-section")).toHaveTextContent(
      ":20",
    );
    expect(screen.getByTestId("archived-scoreboards-section")).toHaveTextContent(
      ":20",
    );
  });
});
