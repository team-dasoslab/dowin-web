import { useTranslations } from "next-intl";

type AchievementProgressProps = {
  achievedCount: number;
  periodLabel?: string;
  targetValue: number;
  trackBackgroundClassName?: string;
  valueTextSizeClassName?: string;
};

export function AchievementProgress({
  achievedCount,
  periodLabel,
  targetValue,
  trackBackgroundClassName = "bg-sub-background",
  valueTextSizeClassName = "text-[12px]",
}: AchievementProgressProps) {
  const t = useTranslations("Dashboard");
  const rate =
    targetValue > 0 ? Math.round((achievedCount / targetValue) * 100) : 0;
  const isCompleted = rate >= 100;

  return (
    <div className="shrink-0 text-right">
      <p className="text-[11px] font-medium text-text-muted">
        {periodLabel ?? t("achievementTab")}
      </p>
      <div className="mt-1 flex flex-row items-center justify-end gap-1.5">
        <div
          className={`h-1.5 w-12 overflow-hidden rounded-full ${trackBackgroundClassName}`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted ? "bg-green-500" : "bg-primary"
            }`}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
        <p
          className={`${valueTextSizeClassName} font-black font-mono ${
            isCompleted ? "text-green-600" : "text-text-muted"
          }`}
        >
          {achievedCount}/{targetValue}
        </p>
      </div>
    </div>
  );
}
