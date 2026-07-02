import { getWeekDates } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";

interface PeriodControlsProps {
  monthLabel?: string;
  resetToToday: () => void;
  selectedDate: string;
  selectedView: "week" | "month";
  setSelectedDate: (value: string) => void;
  movePeriod: (direction: -1 | 1) => void;
  weekLabel: string;
  today: string;
  isPreviousDisabled?: boolean;
  isPeriodLoading?: boolean;
}

export function PeriodControls({
  monthLabel,
  movePeriod,
  resetToToday,
  selectedDate,
  selectedView,
  setSelectedDate,
  weekLabel,
  today,
  isPreviousDisabled,
  isPeriodLoading,
}: PeriodControlsProps) {
  const t = useTranslations("Dashboard");
  const currentWeekStart = getWeekDates(today)[0] ?? today;
  const isResetVisible =
    selectedView === "month"
      ? selectedDate.slice(0, 7) !== today.slice(0, 7)
      : selectedDate !== currentWeekStart;

  return (
    <>
      {/* ─── 모바일 레이아웃 (sm 미만) ─── */}
      <div className="flex flex-col gap-3 py-2 sm:hidden select-none">
        <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] bg-surface transition-all focus-within:ring-2 focus-within:ring-primary/20 shrink-0">
            <DowinIcon
              name="domain-calendar"
              size="16px"
              className="text-text-muted"
            />
            <input
              type="date"
              aria-label={t("selectDate")}
              value={selectedDate}
              disabled={isPeriodLoading}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="absolute inset-0 w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex flex-1 items-center justify-between gap-1 rounded-[16px] bg-surface p-1.5 h-10">
            <Button
              aria-label={t("previousPeriod")}
              onClick={() => movePeriod(-1)}
              disabled={isPreviousDisabled || isPeriodLoading}
              variant="ghost"
              size="control-icon"
              className="shrink-0"
            >
              <DowinIcon name="nav-chevron-left" size="14px" />
            </Button>

            <div className="flex-1 px-1 text-center text-[13px] font-black text-text-primary tabular-nums truncate">
              {selectedView === "week" ? weekLabel : monthLabel}
            </div>

            <Button
              aria-label={t("nextPeriod")}
              onClick={() => movePeriod(1)}
              disabled={isPeriodLoading}
              variant="ghost"
              size="control-icon"
              className="shrink-0"
            >
              <DowinIcon name="nav-chevron-right" size="14px" />
            </Button>

            {isResetVisible ? (
              <div className="mx-1 h-4 w-px shrink-0 bg-border" />
            ) : null}

            {isResetVisible ? (
              <Button
                aria-label={t("backToToday")}
                onClick={resetToToday}
                disabled={isPeriodLoading}
                variant="ghost"
                size="control"
                className="gap-1 shrink-0 text-text-muted"
              >
                <span className="hidden min-[360px]:inline">
                  {t("backToToday")}
                </span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ─── 데스크톱 레이아웃 (sm 이상) ─── */}
      <div className="hidden sm:flex flex-col gap-4 py-2 select-none">
        {/* Row 2: Navigation & Settings */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-start lg:gap-3">
          <div className="flex items-center gap-4">
            {/* Utility: Calendar Picker */}
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[16px] bg-surface transition-all hover:bg-sub-background">
              <DowinIcon
                name="domain-calendar"
                size="16px"
                className="text-text-muted"
              />
              <input
                type="date"
                aria-label={t("selectDate")}
                value={selectedDate}
                disabled={isPeriodLoading}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>

            {/* Primary Group: Date Navigation */}
            <div className="flex flex-1 items-center justify-between gap-1 rounded-[16px] bg-surface p-1.5 h-10 sm:justify-start lg:flex-none">
              <Button
                aria-label={t("previousPeriod")}
                onClick={() => movePeriod(-1)}
                disabled={isPreviousDisabled || isPeriodLoading}
                variant="ghost"
                size="control-icon"
              >
                <DowinIcon name="nav-chevron-left" size="14px" />
              </Button>

              <div className="flex-1 px-4 text-center text-[13px] font-black text-text-primary tabular-nums sm:flex-none">
                {selectedView === "week" ? weekLabel : monthLabel}
              </div>

              <Button
                aria-label={t("nextPeriod")}
                onClick={() => movePeriod(1)}
                disabled={isPeriodLoading}
                variant="ghost"
                size="control-icon"
              >
                <DowinIcon name="nav-chevron-right" size="14px" />
              </Button>

              {isResetVisible && (
                <div className="mx-1 h-4 w-px bg-border sm:block" />
              )}

              {isResetVisible && (
                <Button
                  aria-label={t("backToToday")}
                  onClick={resetToToday}
                  disabled={isPeriodLoading}
                  variant="ghost"
                  size="control"
                  className="gap-1.5 text-text-muted"
                >
                  <span>{t("backToToday")}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Secondary Group: View Toggle (At the very end) */}
        </div>
      </div>
    </>
  );
}
