import { Button } from "@/components/ui/Button";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

interface PeriodControlsProps {
  monthLabel?: string;
  monthlyGoalCount: number;
  resetToToday: () => void;
  selectedDate: string;
  selectedView: "week" | "month";
  setSelectedDate: (value: string) => void;
  setSelectedView: (value: "week" | "month") => void;
  movePeriod: (direction: -1 | 1) => void;
  weekLabel: string;
  weeklyGoalCount: number;
}

export function PeriodControls({
  monthLabel,
  monthlyGoalCount,
  movePeriod,
  resetToToday,
  selectedDate,
  selectedView,
  setSelectedDate,
  setSelectedView,
  weekLabel,
  weeklyGoalCount,
}: PeriodControlsProps) {
  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex w-fit rounded-lg border border-border bg-sub-background p-1">
            {(["week", "month"] as const).map((view) => {
              const isActive = selectedView === view;

              return (
                <Button
                  key={view}
                  type="button"
                  onClick={() => setSelectedView(view)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                    isActive ? "bg-white text-primary shadow-sm" : "text-text-secondary"
                  }`}
                >
                  {view === "week" ? "주간" : "월간"}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 sm:flex sm:items-center">
              <Button
                type="button"
                onClick={() => movePeriod(-1)}
                className="h-9 w-9 rounded-lg border border-border bg-white text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-text-primary"
              >
                <ChevronLeft className="mx-auto h-4 w-4" />
              </Button>
              <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs text-text-secondary">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent font-mono text-text-primary outline-none"
                />
              </label>
              <Button
                type="button"
                onClick={() => movePeriod(1)}
                className="h-9 w-9 rounded-lg border border-border bg-white text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-text-primary"
              >
                <ChevronRight className="mx-auto h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              onClick={resetToToday}
              className="h-9 w-full rounded-lg border border-border bg-white px-3 text-xs font-bold text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-primary sm:w-auto"
            >
              오늘로 돌아가기
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-text-muted">
          {selectedView === "week"
            ? "선택한 날짜가 포함된 한 주(월~일)를 보여줍니다."
            : "선택한 날짜가 포함된 한 달 전체를 집계합니다."}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-0.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-text-primary">
            {selectedView === "week" ? "주간 선행지표" : "월간 집계"}
          </h2>
          <p className="text-[11px] text-text-muted">
            {selectedView === "week"
              ? `주간 목표(${weeklyGoalCount}개)는 이번 주 기준으로 집계하고, 월간 목표(${monthlyGoalCount}개)는 이번 달 누적으로 집계합니다.`
              : `${monthLabel ?? "선택한 달"} 기준으로 주간/월간 목표(${weeklyGoalCount + monthlyGoalCount}개)를 함께 집계합니다.`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="inline-flex w-fit rounded border border-border bg-sub-background px-2 py-1 font-mono text-[11px] text-text-muted">
            {selectedView === "week" ? weekLabel : monthLabel}
          </span>
          <Button
            asChild
            className="flex items-center justify-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-bold text-text-secondary transition-colors hover:border-[rgba(205,207,213,1)] hover:text-primary"
          >
            <Link href="/setup?mode=addMeasure">
              <Plus className="h-3 w-3" />
              지표 추가
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
