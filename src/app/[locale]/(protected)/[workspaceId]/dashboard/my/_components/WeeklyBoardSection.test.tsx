import { fireEvent, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { WeeklyBoardSection } from "./WeeklyBoardSection";

type WeeklyBoardSectionProps = ComponentProps<typeof WeeklyBoardSection>;

const weekDates = [
  "2026-06-08",
  "2026-06-09",
  "2026-06-10",
  "2026-06-11",
  "2026-06-12",
  "2026-06-13",
  "2026-06-14",
];

function createProps(
  overrides: Partial<WeeklyBoardSectionProps> = {},
): WeeklyBoardSectionProps {
  const toggleLog = vi.fn();
  const onBeforeToggle = vi.fn();

  return {
    activeLeadMeasures: [
      {
        id: 1,
        name: "잠재고객 10명에게 연락하기",
        period: "WEEKLY",
        targetValue: 3,
        tags: [],
      },
      {
        id: 2,
        name: "고객 통화 횟수",
        period: "WEEKLY",
        targetValue: 5,
        tags: [],
        trackingMode: "COUNT",
        dailyTargetCount: 3,
      },
    ] as WeeklyBoardSectionProps["activeLeadMeasures"],
    onBeforeToggle,
    pendingLogKeys: new Set<string>(),
    today: "2026-06-10",
    toggleLog: toggleLog as WeeklyBoardSectionProps["toggleLog"],
    weekDates,
    weeklyGuideById: new Map(),
    weeklyById: new Map([
      [
        1,
        {
          achieved: 1,
          total: 3,
          logs: {
            "2026-06-10": {
              achieved: true,
              count: 0,
              value: true,
            },
          },
        },
      ],
      [
        2,
        {
          achieved: 1,
          total: 5,
          logs: {
            "2026-06-10": {
              achieved: false,
              count: 2,
              value: true,
            },
          },
        },
      ],
    ]) as WeeklyBoardSectionProps["weeklyById"],
    ...overrides,
  };
}

function renderWeeklyBoard(overrides: Partial<WeeklyBoardSectionProps> = {}) {
  const props = createProps(overrides);

  return {
    props,
    ...renderWithProviders(<WeeklyBoardSection {...props} />),
  };
}

describe("WeeklyBoardSection", () => {
  it("renders weekly lead measures and achievement summaries", () => {
    renderWeeklyBoard();

    expect(
      screen.getAllByText("잠재고객 10명에게 연락하기").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("고객 통화 횟수").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1/3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1/5").length).toBeGreaterThan(0);
  });

  it("toggles an editable boolean log after running the pre-toggle hook", () => {
    const { props } = renderWeeklyBoard();

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "잠재고객 10명에게 연락하기 2026-06-10 기록 토글",
      })[0],
    );

    expect(props.onBeforeToggle).toHaveBeenCalledTimes(1);
    expect(props.toggleLog).toHaveBeenCalledWith(1, "2026-06-10");
    expect(
      vi.mocked(props.onBeforeToggle).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(props.toggleLog).mock.invocationCallOrder[0]);
  });

  it("disables all matching boolean log controls while the log is pending", () => {
    const { props } = renderWeeklyBoard({
      pendingLogKeys: new Set(["1:2026-06-10"]),
    });

    const buttons = screen.getAllByRole("button", {
      name: "잠재고객 10명에게 연락하기 2026-06-10 기록 토글",
    });

    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => expect(button).toBeDisabled());

    fireEvent.click(buttons[0]);

    expect(props.onBeforeToggle).not.toHaveBeenCalled();
    expect(props.toggleLog).not.toHaveBeenCalled();
  });

  it("opens a count popover and saves the edited daily count", () => {
    const { props } = renderWeeklyBoard();

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "고객 통화 횟수 2026-06-10 횟수 입력",
      })[0],
    );
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "4" },
    });
    fireEvent.click(screen.getByRole("button", { name: "횟수 저장" }));

    expect(props.toggleLog).toHaveBeenCalledWith(2, "2026-06-10", 4);
    expect(props.onBeforeToggle).not.toHaveBeenCalled();
  });

  it("disables all matching count controls while the log is pending", () => {
    const { props } = renderWeeklyBoard({
      pendingLogKeys: new Set(["2:2026-06-10"]),
    });

    const buttons = screen.getAllByRole("button", {
      name: "고객 통화 횟수 2026-06-10 횟수 입력",
    });

    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => expect(button).toBeDisabled());

    fireEvent.click(buttons[0]);

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(props.toggleLog).not.toHaveBeenCalled();
  });
});
