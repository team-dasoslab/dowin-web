import { getWeekDates } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
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
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-white transition-all focus-within:ring-2 focus-within:ring-primary/20 shrink-0">
            <DowinIcon
              name="domain-calendar"
              size="16px"
              className="text-zinc-400"
            />
            <input
              type="date"
              value={selectedDate}
              disabled={isPeriodLoading}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="absolute inset-0 w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex flex-1 items-center justify-between gap-1 rounded-[16px] bg-white p-1.5 h-10">
            <Button
              type="button"
              onClick={() => movePeriod(-1)}
              disabled={isPreviousDisabled || isPeriodLoading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-30"
            >
              <DowinIcon name="nav-chevron-left" size="14px" />
            </Button>

            <div className="flex-1 px-1 text-center text-[13px] font-black text-zinc-900 tabular-nums truncate">
              {selectedView === "week" ? weekLabel : monthLabel}
            </div>

            <Button
              type="button"
              onClick={() => movePeriod(1)}
              disabled={isPeriodLoading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-30"
            >
              <DowinIcon name="nav-chevron-right" size="14px" />
            </Button>

            {isResetVisible ? (
              <div className="mx-1 h-4 w-px shrink-0 bg-zinc-200" />
            ) : null}

            {isResetVisible ? (
              <Button
                type="button"
                onClick={resetToToday}
                disabled={isPeriodLoading}
                className="flex h-8 shrink-0 items-center gap-1 rounded-[12px] px-3 text-[11px] font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
              >
                <span className="hidden min-[360px]:inline">{t("backToToday")}</span>
              </Button>
            ) : null}
          </div>

          <SegmentedControl
            options={[
              { value: "week", label: t("weekView") },
              { value: "month", label: t("monthView") },
            ]}
            value={selectedView}
            onChange={setSelectedView}
            disabled={isPeriodLoading}
            size="sm"
          />
        </div>
      </div>

      {/* ─── 데스크톱 레이아웃 (sm 이상) ─── */}
      <div className="hidden sm:flex flex-col gap-4 py-2 select-none">
        {/* Row 2: Navigation & Settings */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-start lg:gap-3">
          <div className="flex items-center gap-2">
            {/* Utility: Calendar Picker */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-[16px] bg-white transition-all hover:bg-zinc-50">
              <DowinIcon
                name="domain-calendar"
                size="16px"
                className="text-zinc-400"
              />
              <input
                type="date"
                value={selectedDate}
                disabled={isPeriodLoading}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>

            {/* Primary Group: Date Navigation */}
            <div className="flex flex-1 items-center justify-between gap-1 rounded-[16px] bg-white p-1.5 h-10 sm:justify-start lg:flex-none">
              <Button
                type="button"
                onClick={() => movePeriod(-1)}
                disabled={isPreviousDisabled || isPeriodLoading}
                className="flex h-8 w-8 items-center justify-center rounded-[12px] text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-30"
              >
                <DowinIcon name="nav-chevron-left" size="14px" />
              </Button>

              <div className="flex-1 px-4 text-center text-[13px] font-black text-zinc-900 tabular-nums sm:flex-none">
                {selectedView === "week" ? weekLabel : monthLabel}
              </div>

              <Button
                type="button"
                onClick={() => movePeriod(1)}
                disabled={isPeriodLoading}
                className="flex h-8 w-8 items-center justify-center rounded-[12px] text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-30"
              >
                <DowinIcon name="nav-chevron-right" size="14px" />
              </Button>

              {isResetVisible && (
                <div className="mx-1 h-4 w-px bg-zinc-200 sm:block" />
              )}

              {isResetVisible && (
                <Button
                  type="button"
                  onClick={resetToToday}
                  disabled={isPeriodLoading}
                  className="flex h-8 items-center gap-1.5 rounded-[12px] px-3 text-[12px] font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
                >
                  <span>{t("backToToday")}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Secondary Group: View Toggle (At the very end) */}
          <SegmentedControl
            options={[
              { value: "week", label: t("weekView") },
              { value: "month", label: t("monthView") },
            ]}
            value={selectedView}
            onChange={setSelectedView}
            disabled={isPeriodLoading}
            size="md"
            className="lg:ml-auto w-fit"
          />
        </div>
      </div>
    </>
  );
}
