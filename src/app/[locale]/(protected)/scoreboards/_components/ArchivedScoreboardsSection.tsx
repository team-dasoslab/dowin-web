"use client";

import { ScoreboardCard } from "@/app/[locale]/(protected)/scoreboards/_components/ScoreboardCard";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toNumberId } from "@/lib/client/frontend-api";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

type ArchivedScoreboardItem = {
  endDate?: string | null;
  goalName?: string;
  id?: number | string | null;
  lagMeasure?: string;
  startDate?: string;
};

type ArchivedScoreboardsSectionProps = {
  archivedScoreboards: ArchivedScoreboardItem[];
  onReactivate: (id: number) => void;
  pendingActionId: number | null;
};

export function ArchivedScoreboardsSection({
  archivedScoreboards,
  onReactivate,
  pendingActionId,
}: ArchivedScoreboardsSectionProps) {
  const t = useTranslations("Scoreboard");

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <div>
          <h2 className="text-sm font-bold text-text-primary">
            {t("archivedScoreboards")}
          </h2>
          <p className="text-[11px] text-text-muted">
            {t("archivedScoreboardsDesc")}
          </p>
        </div>
        <Badge className="px-2 py-1 rounded-md border border-border bg-sub-background text-[11px] font-bold text-text-secondary">
          {t("totalCount", { count: archivedScoreboards.length })}
        </Badge>
      </div>

      {archivedScoreboards.length === 0 ? (
        <Card className="border border-dashed border-border rounded-content p-8 bg-white text-center text-sm text-text-muted">
          {t("noArchived")}
        </Card>
      ) : (
        <div className="space-y-3">
          {archivedScoreboards.map((scoreboard) => {
            const scoreboardId = toNumberId(scoreboard.id);

            return (
              <ScoreboardCard
                key={scoreboard.id ?? scoreboard.goalName}
                goalName={scoreboard.goalName}
                lagMeasure={scoreboard.lagMeasure}
                startDate={scoreboard.startDate}
                endDate={scoreboard.endDate}
                action={
                  <Button
                    type="button"
                    disabled={!scoreboardId || pendingActionId !== null}
                    onClick={() => {
                      if (!scoreboardId) {
                        return;
                      }

                      onReactivate(scoreboardId);
                    }}
                    className="px-3 py-1.5 border border-border text-text-secondary hover:border-[rgba(205,207,213,1)] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {pendingActionId === scoreboardId ? (
                      <InlineSpinner
                        size="sm"
                        className="border-text-secondary/20 border-t-text-secondary"
                      />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    {pendingActionId === scoreboardId
                      ? t("reactivating")
                      : t("reactivate")}
                  </Button>
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
