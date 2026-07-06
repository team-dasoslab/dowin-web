"use client";

import { ScoreboardCard } from "@/app/[locale]/(protected)/[workspaceId]/scoreboards/_components/ScoreboardCard";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

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
              variant="subtle"
              size="sm"
              className="flex-shrink-0 gap-1.5 whitespace-nowrap font-black text-text-primary"
            >
              {pendingActionId === activeScoreboardId && (
                <InlineSpinner
                  size="sm"
                  className="border-text-secondary/20 border-t-text-secondary"
                />
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
  const workspaceId = useParams().workspaceId as string;
  return (
    <div className="rounded-[24px] bg-surface p-8 text-center space-y-4">
      <div className="w-12 h-12 bg-primary/5 rounded-[16px] shadow-sm mx-auto flex items-center justify-center">
         <Logo size="24px" className="text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-[15px] font-black text-text-primary">
          {t("noActive")}
        </p>
        <p className="text-[13px] font-medium text-text-muted">{t("noActiveDesc")}</p>
      </div>
      <div className="flex justify-center">
        <Button
          asChild
          variant="primary"
          size="primary"
          className="font-black"
        >
          <Link href={`/${workspaceId}/setup?mode=create`}>
            {td("createScoreboard")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
