import { formatDate } from "@/app/(protected)/scoreboards/_lib/scoreboards";
import { Card } from "@/components/ui/Card";
import { CalendarDays, Target } from "lucide-react";
import { ReactNode } from "react";

type ScoreboardCardProps = {
  goalName?: string;
  lagMeasure?: string;
  startDate?: string;
  endDate?: string | null;
  action: ReactNode;
};

export function ScoreboardCard({
  action,
  endDate,
  goalName,
  lagMeasure,
  startDate,
}: ScoreboardCardProps) {
  return (
    <Card className="border border-border rounded-lg p-5 space-y-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 className="text-base font-bold text-text-primary">
            {goalName || "이름 없는 점수판"}
          </h2>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Target className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <span className="leading-relaxed">
              {lagMeasure || "후행지표가 없습니다."}
            </span>
          </div>
        </div>
        {action}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
        <span className="inline-flex items-center gap-1 rounded-md bg-sub-background px-2 py-1 border border-border">
          <CalendarDays className="w-3 h-3" />
          활성 기간 {formatDate(startDate)} -{" "}
          {endDate ? formatDate(endDate) : "진행 중"}
        </span>
      </div>
    </Card>
  );
}
