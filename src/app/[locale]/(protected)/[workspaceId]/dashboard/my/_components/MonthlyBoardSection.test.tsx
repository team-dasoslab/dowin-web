import { screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { MonthlyBoardSection } from "./MonthlyBoardSection";

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

type MonthlyBoardSectionProps = ComponentProps<typeof MonthlyBoardSection>;

const monthWeeks = [
  [
    "2026-06-01",
    "2026-06-02",
    "2026-06-03",
    "2026-06-04",
    "2026-06-05",
    "2026-06-06",
    "2026-06-07",
  ],
  [
    "2026-06-08",
    "2026-06-09",
    "2026-06-10",
    "2026-06-11",
    "2026-06-12",
    "2026-06-13",
    "2026-06-14",
  ],
  [
    "2026-06-15",
    "2026-06-16",
    "2026-06-17",
    "2026-06-18",
    "2026-06-19",
    "2026-06-20",
    "2026-06-21",
  ],
  [
    "2026-06-22",
    "2026-06-23",
    "2026-06-24",
    "2026-06-25",
    "2026-06-26",
    "2026-06-27",
    "2026-06-28",
  ],
  ["2026-06-29", "2026-06-30", null, null, null, null, null],
] as MonthlyBoardSectionProps["monthWeeks"];

function createProps(
  overrides: Partial<MonthlyBoardSectionProps> = {},
): MonthlyBoardSectionProps {
  return {
    activeLeadMeasures: [
      {
        id: 1,
        name: "잠재고객 10명에게 연락하기",
        period: "WEEKLY",
        tags: [{ id: 11, name: "영업" }],
        targetValue: 3,
      },
      {
        id: 2,
        name: "고객 통화 횟수",
        period: "WEEKLY",
        tags: [{ id: 12, name: "고객" }],
        targetValue: 5,
      },
    ] as MonthlyBoardSectionProps["activeLeadMeasures"],
    monthLabel: "2026년 6월",
    monthWeeks,
    monthlyLeadMeasures: [
      {
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
      },
      {
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
        trackingMode: "COUNT",
      },
    ] as MonthlyBoardSectionProps["monthlyLeadMeasures"],
    monthlyOverallRate: 40,
    monthlySummary: undefined,
    today: "2026-06-10",
    ...overrides,
  };
}

function renderMonthlyBoard(overrides: Partial<MonthlyBoardSectionProps> = {}) {
  return renderWithProviders(<MonthlyBoardSection {...createProps(overrides)} />);
}

describe("MonthlyBoardSection", () => {
  it("renders the empty state when there are no monthly lead measures", () => {
    renderMonthlyBoard({
      monthlyLeadMeasures: [],
    });

    expect(
      screen.getByText("선택한 달에 집계할 월간 액션 아이템이 없습니다."),
    ).toBeInTheDocument();
  });

  it("renders week cards with date ranges for the selected month", () => {
    renderMonthlyBoard();

    expect(screen.getAllByText("1주차").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5주차").length).toBeGreaterThan(0);
    expect(screen.getAllByText("06.01 – 06.07").length).toBeGreaterThan(0);
    expect(screen.getAllByText("06.29 – 06.30").length).toBeGreaterThan(0);
  });

  it("uses active lead measure tags when rendering monthly rows", () => {
    renderMonthlyBoard();

    expect(
      screen.getAllByText("잠재고객 10명에게 연락하기").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/영업/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/고객/).length).toBeGreaterThan(0);
  });

  it("renders boolean and count records with visible achievement summaries", () => {
    renderMonthlyBoard();

    expect(screen.getAllByText("2/3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1/3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0/5").length).toBeGreaterThan(0);
  });
});
