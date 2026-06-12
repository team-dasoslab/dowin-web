import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { PeriodControls } from "./PeriodControls";

const resetToToday = vi.fn();
const setSelectedDate = vi.fn();
const movePeriod = vi.fn();

function renderPeriodControls(
  overrides: Partial<React.ComponentProps<typeof PeriodControls>> = {},
) {
  return renderWithProviders(
    <PeriodControls
      monthLabel="2026년 6월"
      movePeriod={movePeriod}
      resetToToday={resetToToday}
      selectedDate="2026-06-08"
      selectedView="week"
      setSelectedDate={setSelectedDate}
      today="2026-06-10"
      weekLabel="2026.06.08 - 06.14"
      {...overrides}
    />,
  );
}

describe("PeriodControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the week label and keeps today reset hidden for the current week", () => {
    renderPeriodControls();

    expect(screen.getAllByText("2026.06.08 - 06.14")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "오늘로 돌아가기" }),
    ).not.toBeInTheDocument();
  });

  it("renders the month label and reset button when selected month differs from today", () => {
    renderPeriodControls({
      monthLabel: "2026년 5월",
      selectedDate: "2026-05-01",
      selectedView: "month",
    });

    expect(screen.getAllByText("2026년 5월")).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "오늘로 돌아가기" }),
    ).toHaveLength(2);
  });

  it("wires date, previous, next, and reset controls", () => {
    renderPeriodControls({ selectedDate: "2026-06-01" });

    fireEvent.change(screen.getAllByLabelText("날짜 선택")[0], {
      target: { value: "2026-06-03" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "이전 기간" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "다음 기간" })[0]);
    fireEvent.click(
      screen.getAllByRole("button", { name: "오늘로 돌아가기" })[0],
    );

    expect(setSelectedDate).toHaveBeenCalledWith("2026-06-03");
    expect(movePeriod).toHaveBeenCalledWith(-1);
    expect(movePeriod).toHaveBeenCalledWith(1);
    expect(resetToToday).toHaveBeenCalledTimes(1);
  });

  it("disables previous period when history navigation is blocked", () => {
    renderPeriodControls({ isPreviousDisabled: true });

    for (const button of screen.getAllByRole("button", {
      name: "이전 기간",
    })) {
      expect(button).toBeDisabled();
    }

    fireEvent.click(screen.getAllByRole("button", { name: "이전 기간" })[0]);
    expect(movePeriod).not.toHaveBeenCalled();
  });

  it("disables all period controls while period data is loading", () => {
    renderPeriodControls({
      isPeriodLoading: true,
      selectedDate: "2026-06-01",
    });

    for (const input of screen.getAllByLabelText("날짜 선택")) {
      expect(input).toBeDisabled();
    }
    for (const button of screen.getAllByRole("button", {
      name: "이전 기간",
    })) {
      expect(button).toBeDisabled();
    }
    for (const button of screen.getAllByRole("button", {
      name: "다음 기간",
    })) {
      expect(button).toBeDisabled();
    }
    for (const button of screen.getAllByRole("button", {
      name: "오늘로 돌아가기",
    })) {
      expect(button).toBeDisabled();
    }
  });
});
