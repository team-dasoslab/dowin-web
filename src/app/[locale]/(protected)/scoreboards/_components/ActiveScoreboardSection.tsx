"use client";

import { ScoreboardCard } from "@/app/[locale]/(protected)/scoreboards/_components/ScoreboardCard";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Archive20Regular, Add20Regular, Flash20Filled } from "@fluentui/react-icons";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type ScoreboardSummary = {
  endDate?: string | null;
  goalName?: string;
  lagMeasure?: string;
  startDate?: string;
};

type ActiveScoreboardSectionProps = {
  activeScoreboard: ScoreboardSummary | null;
  activeScoreboardId: number | null;
  onArchive: (id: number) => void;
  pendingActionId: number | null;
};

export function ActiveScoreboardSection({
  activeScoreboard,
  activeScoreboardId,
  onArchive,
  pendingActionId,
}: ActiveScoreboardSectionProps) {
  const t = useTranslations("Scoreboard");

  return (
    <section className="space-y-3">

      {activeScoreboard && activeScoreboardId ? (
        <ScoreboardCard
          goalName={activeScoreboard.goalName}
          lagMeasure={activeScoreboard.lagMeasure}
          startDate={activeScoreboard.startDate}
          endDate={activeScoreboard.endDate}
          action={
            <Button
              type="button"
              disabled={pendingActionId !== null}
              onClick={() => {
                if (confirm(t("confirmArchive"))) {
                  onArchive(activeScoreboardId);
                }
              }}
              className="px-3 py-1.5 border border-border text-text-secondary hover:border-[rgba(205,207,213,1)] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {pendingActionId === activeScoreboardId ? (
                <InlineSpinner
                  size="sm"
                  className="border-text-secondary/20 border-t-text-secondary"
                />
              ) : (
                <Archive20Regular className="w-3.5 h-3.5" />
              )}
              {pendingActionId === activeScoreboardId
                ? t("archiving")
                : t("archiveButton")}
            </Button>
          }
        />
      ) : (
        <EmptyActiveScoreboardCard />
      )}
    </section>
  );
}

function EmptyActiveScoreboardCard() {
  const t = useTranslations("Scoreboard");
  const td = useTranslations("Dashboard");
  return (
    <Card className="border border-dashed border-border rounded-content p-8 bg-white text-center space-y-4">
      <div className="w-12 h-12 bg-primary/10 rounded-content  mx-auto flex items-center justify-center">
        <Flash20Filled className="text-primary w-6 h-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text-primary">
          {t("noActive")}
        </p>
        <p className="text-xs text-text-muted">{t("noActiveDesc")}</p>
      </div>
      <div className="flex justify-center">
        <Button
          asChild
          className="btn-linear-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
        >
          <Link href="/setup?mode=create">
            <Add20Regular className="w-3.5 h-3.5" />
            {td("createScoreboard")}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
