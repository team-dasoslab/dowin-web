"use client";

import { ScoreboardCard } from "@/app/[locale]/(protected)/[workspaceId]/scoreboards/_components/ScoreboardCard";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { toNumberId } from "@/lib/client/frontend-api";
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

      {archivedScoreboards.length === 0 ? (
        <div className="rounded-[24px] bg-surface p-8 text-center text-[13px] font-medium text-text-muted">
          {t("noArchived")}
        </div>
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
                    variant="subtle"
                    className="flex h-10 items-center gap-1.5 rounded-[16px] px-4 text-[13px] font-black text-text-primary whitespace-nowrap flex-shrink-0"
                  >
                    {pendingActionId === scoreboardId && (
                      <InlineSpinner
                        size="sm"
                        className="border-text-secondary/20 border-t-text-secondary"
                      />
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
