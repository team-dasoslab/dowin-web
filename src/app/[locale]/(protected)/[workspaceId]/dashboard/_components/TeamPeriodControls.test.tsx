import { fireEvent, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { TeamPeriodControls } from "./TeamPeriodControls";

type TeamPeriodControlsProps = ComponentProps<typeof TeamPeriodControls>;

function createProps(
  overrides: Partial<TeamPeriodControlsProps> = {},
): TeamPeriodControlsProps {
  return {
    isPeriodLoading: false,
    isPreviousDisabled: false,
    isResetVisible: false,
    movePeriod: vi.fn(),
    resetToToday: vi.fn(),
    selectedDate: "2026-06-10",
    setSelectedDate: vi.fn(),
    weekLabel: "2026.06.08 - 2026.06.14",
    ...overrides,
  };
}

function renderTeamPeriodControls(
  overrides: Partial<TeamPeriodControlsProps> = {},
) {
  const props = createProps(overrides);

  return {
    props,
    ...renderWithProviders(<TeamPeriodControls {...props} />),
  };
}

describe("TeamPeriodControls", () => {
  it("renders the selected week and hides reset by default", () => {
    renderTeamPeriodControls();

    expect(screen.getByText("2026.06.08 - 2026.06.14")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "오늘로 돌아가기" }),
    ).not.toBeInTheDocument();
  });

  it("wires date, previous, next, and reset controls", () => {
    const { props } = renderTeamPeriodControls({
      isResetVisible: true,
    });

    fireEvent.change(screen.getByLabelText("날짜 선택"), {
      target: { value: "2026-06-03" },
    });
    fireEvent.click(screen.getByRole("button", { name: "이전 기간" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 기간" }));
    fireEvent.click(screen.getByRole("button", { name: "오늘로 돌아가기" }));

    expect(props.setSelectedDate).toHaveBeenCalledWith("2026-06-03");
    expect(props.movePeriod).toHaveBeenCalledWith(-1);
    expect(props.movePeriod).toHaveBeenCalledWith(1);
    expect(props.resetToToday).toHaveBeenCalledTimes(1);
  });

  it("disables previous period when older history is unavailable", () => {
    const { props } = renderTeamPeriodControls({
      isPreviousDisabled: true,
    });

    fireEvent.click(screen.getByRole("button", { name: "이전 기간" }));

    expect(screen.getByRole("button", { name: "이전 기간" })).toBeDisabled();
    expect(props.movePeriod).not.toHaveBeenCalled();
  });

  it("disables all controls while the period is loading", () => {
    const { props } = renderTeamPeriodControls({
      isPeriodLoading: true,
      isResetVisible: true,
    });

    expect(screen.getByLabelText("날짜 선택")).toBeDisabled();
    expect(screen.getByRole("button", { name: "이전 기간" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음 기간" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "오늘로 돌아가기" }),
    ).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "다음 기간" }));
    fireEvent.click(screen.getByRole("button", { name: "오늘로 돌아가기" }));

    expect(props.movePeriod).not.toHaveBeenCalled();
    expect(props.resetToToday).not.toHaveBeenCalled();
  });
});
