import { formatDate } from "@/app/[locale]/(protected)/scoreboards/_lib/scoreboards";
import { Card } from "@/components/ui/Card";
import { Target20Regular } from "@fluentui/react-icons";
import { PeriodBadge } from "@/components/ui/PeriodBadge";
import { ReactNode } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Scoreboard");

  return (
    <Card className="border border-border rounded-content p-5 space-y-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 className="text-base font-bold text-text-primary">
            {goalName || t("unnamedScoreboard")}
          </h2>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Target20Regular className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <span className="leading-relaxed">
              {lagMeasure || t("noLagMeasure")}
            </span>
          </div>
        </div>
        {action}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PeriodBadge
          label={`${t("activePeriod")} ${formatDate(startDate)} - ${endDate ? formatDate(endDate) : t("inProgress")}`}
        />
      </div>
    </Card>
  );
}
