import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface PeriodControlsProps {
  monthLabel?: string;
  resetToToday: () => void;
  selectedDate: string;
  selectedView: "week" | "month";
  setSelectedDate: (value: string) => void;
  setSelectedView: (value: "week" | "month") => void;
  movePeriod: (direction: -1 | 1) => void;
  weekLabel: string;
  today: string;
  historyLimitDate?: string;
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
  setSelectedView,
  weekLabel,
  today,
  historyLimitDate,
  isPreviousDisabled,
  isPeriodLoading,
}: PeriodControlsProps) {
  const t = useTranslations("Dashboard");

  return (
    <>
      {/* ─── 모바일 레이아웃 (sm 미만) ─── */}
      <div className="flex flex-col gap-3 py-2 sm:hidden select-none">
        {/* Title */}
        <h2 className="text-base font-bold tracking-tight text-text-primary">
          {selectedView === "week"
            ? t("weeklyLeadMeasures")
            : t("monthlyAggregation")}
        </h2>

        {/* Row 1: 주간/월간 | 날짜  <space between>  지표추가버튼 */}
        <div className="flex items-center justify-between gap-2">
          {/* Left Part: 주간/월간 | 날짜 */}
          <div className="flex items-center gap-1.5 rounded-button border border-border bg-white p-1 shrink min-w-0">
            {/* View Toggle */}
            <div className="inline-flex shrink-0 rounded-button bg-sub-background p-0.5">
              {(["week", "month"] as const).map((view) => {
                const isActive = selectedView === view;
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setSelectedView(view)}
                    disabled={isPeriodLoading}
                    className={`rounded-button px-2.5 py-1 text-[11px] font-bold transition-all ${
                      isActive
                        ? "bg-white text-primary border border-border shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {view === "week" ? t("weekView") : t("monthView")}
                  </button>
                );
              })}
            </div>

            {/* Divider | */}
            <div className="h-4 w-px bg-border shrink-0 mx-0.5" />

            {/* Calendar Picker + Date Text */}
            <div className="relative flex items-center justify-center gap-1 px-1.5 py-0.5 cursor-pointer rounded-button hover:bg-zinc-100/60 transition-all shrink min-w-0">
              <DowinIcon name="domain-calendar" size="14px" className="text-zinc-400 shrink-0" />
              <span className="text-[12px] font-bold text-text-primary tabular-nums shrink min-w-0 truncate">
                {selectedView === "week" ? weekLabel : monthLabel}
              </span>
              <input
                type="date"
                value={selectedDate}
                min={historyLimitDate}
                disabled={isPeriodLoading}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>
          </div>

          {/* 지표추가버튼 */}
          <Button
            asChild
            className="flex h-9 items-center justify-center gap-1.5 rounded-button border border-primary/20 bg-primary/5 px-4 text-[12px] font-bold text-primary transition-all hover:bg-primary/10 shrink-0"
          >
            <Link href="/setup?mode=addMeasure">
              <DowinIcon name="action-add" size="14px" />
              <span className="inline">{t("addMeasure")}</span>
            </Link>
          </Button>
        </div>

        {/* Row 2: < > 오늘로 돌아가기 버튼 */}
        <div className="flex items-center gap-2">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-1 rounded-button border border-border bg-white p-1 shrink-0">
            <Button
              type="button"
              onClick={() => movePeriod(-1)}
              disabled={isPreviousDisabled || isPeriodLoading}
              className="flex h-7 w-7 items-center justify-center rounded-button text-text-secondary hover:bg-zinc-100 hover:text-primary disabled:opacity-30"
            >
              <DowinIcon name="nav-chevron-left" size="14px" />
            </Button>

            <Button
              type="button"
              onClick={() => movePeriod(1)}
              disabled={isPeriodLoading}
              className="flex h-7 w-7 items-center justify-center rounded-button text-text-secondary hover:bg-zinc-100 hover:text-primary disabled:opacity-30"
            >
              <DowinIcon name="nav-chevron-right" size="14px" />
            </Button>
          </div>

          {/* 오늘로 돌아가기 (Only shown when selectedDate !== today) */}
          {selectedDate !== today && (
            <Button
              type="button"
              onClick={resetToToday}
              disabled={isPeriodLoading}
              className="flex h-9 items-center gap-1 rounded-button border border-border bg-white px-3 text-[11px] font-bold text-text-secondary hover:bg-zinc-100 hover:text-primary transition-all shrink-0"
            >
              <DowinIcon name="action-refresh" size="11px" />
              <span>{t("backToToday")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ─── 데스크톱 레이아웃 (sm 이상) ─── */}
      <div className="hidden sm:flex flex-col gap-4 py-2 select-none">
        {/* Row 1: Title & Add Button */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold tracking-tight text-text-primary">
            {selectedView === "week"
              ? t("weeklyLeadMeasures")
              : t("monthlyAggregation")}
          </h2>

          <Button
            asChild
            className="flex h-9 items-center justify-center gap-1.5 rounded-button border border-primary/20 bg-primary/5 px-4 text-[12px] font-bold text-primary transition-all hover:bg-primary/10 lg:h-8 lg:px-3 lg:text-[11px]"
          >
            <Link href="/setup?mode=addMeasure">
              <DowinIcon name="action-add" size="14px" />
              <span className="sm:inline">{t("addMeasure")}</span>
            </Link>
          </Button>
        </div>

        {/* Row 2: Navigation & Settings */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-start lg:gap-3">
          <div className="flex items-center gap-2">
            {/* Utility: Calendar Picker */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-button border border-border bg-white transition-all hover:border-primary/30 focus-within:border-primary/30">
              <DowinIcon name="domain-calendar" size="16px" className="text-zinc-400" />
              <input
                type="date"
                value={selectedDate}
                min={historyLimitDate}
                disabled={isPeriodLoading}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>

            {/* Primary Group: Date Navigation */}
            <div className="flex flex-1 items-center justify-between gap-1 rounded-button border border-border bg-white p-1 sm:justify-start lg:flex-none">
              <Button
                type="button"
                onClick={() => movePeriod(-1)}
                disabled={isPreviousDisabled || isPeriodLoading}
                className="flex h-7 w-7 items-center justify-center rounded-button text-text-secondary hover:bg-zinc-100 hover:text-primary disabled:opacity-30"
              >
                <DowinIcon name="nav-chevron-left" size="14px" />
              </Button>
              
              <div className="flex-1 px-3 text-center text-[12px] font-bold text-text-primary tabular-nums sm:flex-none">
                {selectedView === "week" ? weekLabel : monthLabel}
              </div>

              <Button
                type="button"
                onClick={() => movePeriod(1)}
                disabled={isPeriodLoading}
                className="flex h-7 w-7 items-center justify-center rounded-button text-text-secondary hover:bg-zinc-100 hover:text-primary disabled:opacity-30"
              >
                <DowinIcon name="nav-chevron-right" size="14px" />
              </Button>

              {selectedDate !== today && (
                <div className="mx-1 h-3 w-px bg-border sm:block" />
              )}

              {selectedDate !== today && (
                <Button
                  type="button"
                  onClick={resetToToday}
                  disabled={isPeriodLoading}
                  className="flex h-7 items-center gap-1 rounded-button px-2 text-[10px] font-bold text-text-secondary hover:bg-zinc-100 hover:text-primary"
                >
                  <DowinIcon name="action-refresh" size="10px" />
                  <span>{t("backToToday")}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Secondary Group: View Toggle (At the very end) */}
          <div className="inline-flex w-fit shrink-0 rounded-button border border-border bg-sub-background p-1 lg:ml-auto">
            {(["week", "month"] as const).map((view) => {
              const isActive = selectedView === view;
              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => setSelectedView(view)}
                  disabled={isPeriodLoading}
                  className={`rounded-button px-3 py-1 text-[11px] font-bold transition-all ${
                    isActive
                      ? "bg-white text-primary border border-border shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {view === "week" ? t("weekView") : t("monthView")}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
