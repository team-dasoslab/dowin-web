import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";

type TeamPeriodControlsProps = {
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
        <div className="flex items-center gap-4">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-surface transition-all focus-within:ring-2 focus-within:ring-primary/20 hover:bg-sub-background">
            <DowinIcon
              name="domain-calendar"
              size="16px"
              className="text-text-muted"
            />
            <input
              aria-label={t("selectDate")}
              type="date"
              value={selectedDate}
              disabled={isPeriodLoading}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="absolute inset-0 w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex flex-1 items-center justify-between gap-1 rounded-[16px] bg-surface p-1.5 h-10 sm:justify-start lg:flex-none">
            <Button
              aria-label={t("previousPeriod")}
              onClick={() => movePeriod(-1)}
              disabled={isPreviousDisabled || isPeriodLoading}
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <DowinIcon name="nav-chevron-left" size="14px" />
            </Button>

            <div className="flex-1 px-4 text-center text-[13px] font-bold text-text-primary tabular-nums sm:flex-none">
              {weekLabel}
            </div>

            <Button
              aria-label={t("nextPeriod")}
              onClick={() => movePeriod(1)}
              disabled={isPeriodLoading}
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <DowinIcon name="nav-chevron-right" size="14px" />
            </Button>

            {isResetVisible ? (
              <div className="mx-1 h-4 w-px bg-border sm:block" />
            ) : null}

            {isResetVisible ? (
              <Button
                aria-label={t("backToToday")}
                onClick={resetToToday}
                disabled={isPeriodLoading}
                variant="ghost"
                className="h-8 px-3 gap-1.5"
              >
                <span>{t("backToToday")}</span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
