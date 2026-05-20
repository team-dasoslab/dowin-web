import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";

type TeamPeriodControlsProps = {
  historyLimitDate?: string;
  isPeriodLoading?: boolean;
  isPreviousDisabled?: boolean;
  isResetVisible?: boolean;
  movePeriod: (direction: -1 | 1) => void;
  resetToToday: () => void;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  weekLabel: string;
};

export function TeamPeriodControls({
  historyLimitDate,
  isPeriodLoading,
  isPreviousDisabled,
  isResetVisible = false,
  movePeriod,
  resetToToday,
  selectedDate,
  setSelectedDate,
  weekLabel,
}: TeamPeriodControlsProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex flex-col gap-2 py-2 select-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-start lg:gap-3">
        <div className="flex items-center gap-5 sm:gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-button border border-border bg-white transition-all focus-within:border-primary/30">
            <DowinIcon
              name="domain-calendar"
              size="16px"
              className="text-zinc-400"
            />
            <input
              type="date"
              value={selectedDate}
              min={historyLimitDate}
              disabled={isPeriodLoading}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="absolute inset-0 w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex flex-1 items-center justify-between gap-1 rounded-button border border-border bg-white p-1 sm:justify-start lg:flex-none">
            <Button
              type="button"
              onClick={() => movePeriod(-1)}
              disabled={isPreviousDisabled || isPeriodLoading}
              className="flex h-7 w-7 items-center justify-center rounded-button text-text-secondary disabled:opacity-30"
            >
              <DowinIcon name="nav-chevron-left" size="14px" />
            </Button>

            <div className="flex-1 px-3 text-center text-[12px] font-bold text-text-primary tabular-nums sm:flex-none">
              {weekLabel}
            </div>

            <Button
              type="button"
              onClick={() => movePeriod(1)}
              disabled={isPeriodLoading}
              className="flex h-7 w-7 items-center justify-center rounded-button text-text-secondary disabled:opacity-30"
            >
              <DowinIcon name="nav-chevron-right" size="14px" />
            </Button>

            {isResetVisible ? (
              <div className="mx-1 h-3 w-px bg-border sm:block" />
            ) : null}

            {isResetVisible ? (
              <Button
                type="button"
                onClick={resetToToday}
                disabled={isPeriodLoading}
                className="flex h-7 items-center gap-1 rounded-button px-2 text-[10px] font-bold text-text-secondary"
              >
                <DowinIcon name="action-refresh" size="10px" />
                <span>{t("backToToday")}</span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
