type AchievementProgressProps = {
  achievedCount: number;
  targetValue: number;
  trackBackgroundClassName?: string;
  valueTextSizeClassName?: string;
};

export function AchievementProgress({
  achievedCount,
  targetValue,
  trackBackgroundClassName = "bg-sub-background",
  valueTextSizeClassName = "text-sm",
}: AchievementProgressProps) {
  const rate =
    targetValue > 0 ? Math.round((achievedCount / targetValue) * 100) : 0;
  const isCompleted = rate >= 100;

  return (
    <div className="shrink-0 text-right">
      <p className="text-[10px] text-text-muted">달성</p>
      <div className="mt-1 flex flex-row items-center justify-end gap-1.5">
        <div
          className={`h-1 w-12 overflow-hidden rounded-full border border-border ${trackBackgroundClassName}`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted ? "bg-green-500" : "bg-primary"
            }`}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
        <p
          className={`${valueTextSizeClassName} font-bold font-mono ${
            isCompleted ? "text-green-600" : "text-text-secondary"
          }`}
        >
          {achievedCount}/{targetValue}
        </p>
      </div>
    </div>
  );
}
