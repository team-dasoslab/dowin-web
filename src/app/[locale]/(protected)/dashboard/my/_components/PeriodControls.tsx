import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

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
  historyLimitDate?: string;
  isPreviousDisabled?: boolean;
  isPeriodLoading?: boolean;
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
  historyLimitDate,
  isPreviousDisabled,
  isPeriodLoading,
}: PeriodControlsProps) {
  const t = useTranslations("Dashboard");
  const tc = useTranslations("Common");

  return (
    <>
      <div className="flex flex-col gap-3 rounded-content border border-border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex w-fit rounded-content border border-border bg-sub-background p-1">
            {(["week", "month"] as const).map((view) => {
              const isActive = selectedView === view;

              return (
                <Button
                  key={view}
                  type="button"
                  onClick={() => setSelectedView(view)}
                  disabled={isPeriodLoading}
                  className={`rounded-button px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                    isActive
                      ? "bg-white text-primary shadow-sm border border-border"
                      : "text-text-secondary"
                  }`}
                >
                  {view === "week" ? t("weekView") : t("monthView")}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 sm:flex sm:items-center">
              <Button
                type="button"
                onClick={() => movePeriod(-1)}
                disabled={isPreviousDisabled || isPeriodLoading}
                className="h-9 w-9 rounded-button border border-border bg-white text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="mx-auto h-4 w-4" />
              </Button>
              <label className="flex h-9 min-w-0 items-center gap-2 rounded-content border border-border bg-white px-3 text-xs text-text-secondary">
                <input
                  type="date"
                  value={selectedDate}
                  min={historyLimitDate}
                  disabled={isPeriodLoading}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent font-mono text-text-primary outline-none disabled:opacity-50"
                />
              </label>
              <Button
                type="button"
                onClick={() => movePeriod(1)}
                disabled={isPeriodLoading}
                className="h-9 w-9 rounded-button border border-border bg-white text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="mx-auto h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              onClick={resetToToday}
              disabled={isPeriodLoading}
              className="h-9 w-full rounded-button border border-border bg-white px-3 text-xs font-bold text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed sm:w-auto"
            >
              {t("backToToday")}
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-text-muted">
          {selectedView === "week" ? t("weekViewDesc") : t("monthViewDesc")}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-0.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-text-primary">
            {selectedView === "week"
              ? t("weeklyLeadMeasures")
              : t("monthlyAggregation")}
          </h2>
          <p className="text-[11px] text-text-muted">
            {selectedView === "week"
              ? t("weeklyLeadMeasuresDesc", {
                  count: weeklyGoalCount,
                  monthlyCount: monthlyGoalCount,
                })
              : t("monthlyAggregationDesc", {
                  month: monthLabel ?? tc("unsetTitle"),
                  count: weeklyGoalCount + monthlyGoalCount,
                })}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="inline-flex w-fit rounded border border-zinc-200 bg-zinc-100/80 px-2 py-1 font-mono text-[11px] font-bold text-zinc-600">
            {selectedView === "week" ? weekLabel : monthLabel}
          </span>
          <Button
            asChild
            className="flex items-center justify-center gap-1 rounded-button border border-border bg-white px-2.5 py-1.5 text-[11px] font-bold text-text-secondary transition-colors hover:border-[rgba(205,207,213,1)] hover:text-primary"
          >
            <Link href="/setup?mode=addMeasure">
              <Plus className="h-3 w-3" />
              {t("addMeasure")}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
