import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { ActiveScoreboardSection } from "./ActiveScoreboardSection";
import { ArchivedScoreboardsSection } from "./ArchivedScoreboardsSection";

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

describe("scoreboard archive sections", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("archives the active scoreboard only after confirmation", () => {
    const onArchive = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithProviders(
      <ActiveScoreboardSection
        activeScoreboard={{
          endDate: null,
          goalName: "분기 매출 1억원 만들기",
          lagMeasure: "월 매출 3천만원에서 1억원으로",
          startDate: "2026-06-01",
        }}
        activeScoreboardId={10}
        onArchive={onArchive}
        pendingActionId={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "보관" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "현재 활성 점수판을 보관하시겠습니까?",
    );
    expect(onArchive).toHaveBeenCalledWith(10);
  });

  it("does not archive when the confirmation is cancelled", () => {
    const onArchive = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderWithProviders(
      <ActiveScoreboardSection
        activeScoreboard={{
          goalName: "분기 매출 1억원 만들기",
          lagMeasure: "월 매출 3천만원에서 1억원으로",
          startDate: "2026-06-01",
        }}
        activeScoreboardId={10}
        onArchive={onArchive}
        pendingActionId={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "보관" }));

    expect(onArchive).not.toHaveBeenCalled();
  });

  it("renders the empty active scoreboard CTA", () => {
    renderWithProviders(
      <ActiveScoreboardSection
        activeScoreboard={null}
        activeScoreboardId={null}
        onArchive={vi.fn()}
        pendingActionId={null}
      />,
    );

    expect(screen.getByText("현재 활성 점수판이 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 점수판 만들기" })).toHaveAttribute(
      "href",
      "/workspace-1/setup?mode=create",
    );
  });

  it("reactivates archived scoreboards with numeric string ids", () => {
    const onReactivate = vi.fn();

    renderWithProviders(
      <ArchivedScoreboardsSection
        archivedScoreboards={[
          {
            endDate: "2026-06-30",
            goalName: "지난 점수판",
            id: "20",
            lagMeasure: "지난 성공 기준",
            startDate: "2026-06-01",
          },
        ]}
        onReactivate={onReactivate}
        pendingActionId={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 활성화" }));

    expect(onReactivate).toHaveBeenCalledWith(20);
  });

  it("disables archived scoreboard actions while any status change is pending", () => {
    const onReactivate = vi.fn();

    renderWithProviders(
      <ArchivedScoreboardsSection
        archivedScoreboards={[
          {
            goalName: "지난 점수판",
            id: 20,
            lagMeasure: "지난 성공 기준",
            startDate: "2026-06-01",
          },
          {
            goalName: "id 없는 점수판",
            id: null,
            lagMeasure: "성공 기준 없음",
            startDate: "2026-07-01",
          },
        ]}
        onReactivate={onReactivate}
        pendingActionId={20}
      />,
    );

    expect(screen.getByRole("button", { name: /활성화 중/ })).toBeDisabled();
    screen
      .getAllByRole("button")
      .forEach((button) => expect(button).toBeDisabled());
  });

  it("renders an empty archived scoreboard state", () => {
    renderWithProviders(
      <ArchivedScoreboardsSection
        archivedScoreboards={[]}
        onReactivate={vi.fn()}
        pendingActionId={null}
      />,
    );

    expect(
      screen.getByText("아직 보관된 점수판이 없습니다."),
    ).toBeInTheDocument();
  });
});
