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
          <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-white transition-all focus-within:ring-2 focus-within:ring-primary/20 hover:bg-zinc-50 shrink-0">
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

          <div className="flex flex-1 items-center justify-between gap-1 rounded-[16px] bg-white p-1.5 h-10 sm:justify-start lg:flex-none">
            <Button
              type="button"
              onClick={() => movePeriod(-1)}
              disabled={isPreviousDisabled || isPeriodLoading}
              className="flex h-8 w-8 items-center justify-center rounded-[12px] text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-30"
            >
              <DowinIcon name="nav-chevron-left" size="14px" />
            </Button>

            <div className="flex-1 px-4 text-center text-[13px] font-bold text-zinc-900 tabular-nums sm:flex-none">
              {weekLabel}
            </div>

            <Button
              type="button"
              onClick={() => movePeriod(1)}
              disabled={isPeriodLoading}
              className="flex h-8 w-8 items-center justify-center rounded-[12px] text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-30"
            >
              <DowinIcon name="nav-chevron-right" size="14px" />
            </Button>

            {isResetVisible ? (
              <div className="mx-1 h-4 w-px bg-zinc-200 sm:block" />
            ) : null}

            {isResetVisible ? (
              <Button
                type="button"
                onClick={resetToToday}
                disabled={isPeriodLoading}
                className="flex h-8 items-center gap-1.5 rounded-[12px] px-3 text-[12px] font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
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
