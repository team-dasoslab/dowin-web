import { screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { ScoreboardOverviewSection } from "./ScoreboardOverviewSection";

vi.mock("recharts", () => ({
  Area: () => <div data-testid="trend-area" />,
  AreaChart: ({
    data,
  }: {
    data: Array<{ name: string; rate: number }>;
  }) => (
    <div data-testid="trend-chart">
      {data.map((point) => (
        <span key={point.name}>
          {point.name}:{point.rate}
        </span>
      ))}
    </div>
  ),
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="trend-container">{children}</div>
  ),
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

type ScoreboardOverviewSectionProps = ComponentProps<
  typeof ScoreboardOverviewSection
>;

function createProps(
  overrides: Partial<ScoreboardOverviewSectionProps> = {},
): ScoreboardOverviewSectionProps {
  return {
    activeScoreboard: {
      goalName: "분기 매출 1억원 만들기",
      id: 10,
      lagMeasure: "월 매출 3천만원에서 1억원으로",
    } as ScoreboardOverviewSectionProps["activeScoreboard"],
    isWeeklyTrendLoading: false,
    monthlyOverallRate: 45,
    weeklyOverallRate: 82,
    weeklyTrendPoints: [
      { label: "6/1", rate: 40, weekStart: "2026-06-01" },
      { label: "6/8", rate: 82, weekStart: "2026-06-08" },
    ],
    ...overrides,
  };
}

function renderOverview(
  overrides: Partial<ScoreboardOverviewSectionProps> = {},
) {
  return renderWithProviders(<ScoreboardOverviewSection {...createProps(overrides)} />);
}

describe("ScoreboardOverviewSection", () => {
  it("renders the active scoreboard goal, success criteria, and rates", () => {
    renderOverview();

    expect(screen.getByText("핵심 목표")).toBeInTheDocument();
    expect(screen.getByText("분기 매출 1억원 만들기")).toBeInTheDocument();
    expect(screen.getByText("성공 기준")).toBeInTheDocument();
    expect(screen.getByText("월 매출 3천만원에서 1억원으로")).toBeInTheDocument();
    expect(screen.getByText("이번 주 달성률")).toBeInTheDocument();
    expect(screen.getByText("이번 달 달성률")).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("renders recent trend chart points when trend data is ready", () => {
    renderOverview();

    expect(screen.getByText("최근 4주 달성률")).toBeInTheDocument();
    expect(screen.getByTestId("trend-chart")).toHaveTextContent("6/1:40");
    expect(screen.getByTestId("trend-chart")).toHaveTextContent("6/8:82");
  });

  it("keeps the trend chart hidden while weekly trend data is loading", () => {
    const { container } = renderOverview({ isWeeklyTrendLoading: true });

    expect(screen.getByText("최근 4주 달성률")).toBeInTheDocument();
    expect(screen.queryByTestId("trend-chart")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
