import { formatDate } from "@/app/[locale]/(protected)/[workspaceId]/scoreboards/_lib/scoreboards";
import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
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
    <div className="rounded-[24px] bg-white p-5 space-y-4">
      <div className="space-y-2">
        <h2 className="text-base font-bold text-text-primary leading-tight">
          {goalName || t("unnamedScoreboard")}
        </h2>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <DowinIcon name="domain-target-arrow" size="14px" className="text-text-muted flex-shrink-0" />
          <span className="leading-relaxed">
            {lagMeasure || t("noLagMeasure")}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-50">
        <div className="flex-shrink-0">
          <PeriodBadge
            label={`${t("activePeriod")} ${formatDate(startDate)} - ${endDate ? formatDate(endDate) : t("inProgress")}`}
          />
        </div>
        <div className="flex-shrink-0">
          {action}
        </div>
      </div>
    </div>
  );
}
