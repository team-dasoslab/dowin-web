"use client";

import { ActiveScoreboardSection } from "@/app/[locale]/(protected)/scoreboards/_components/ActiveScoreboardSection";
import { ArchivedScoreboardsSection } from "@/app/[locale]/(protected)/scoreboards/_components/ArchivedScoreboardsSection";
import { ScoreboardsHeader } from "@/app/[locale]/(protected)/scoreboards/_components/ScoreboardsHeader";
import { useScoreboardArchive } from "@/app/[locale]/(protected)/scoreboards/_hooks/useScoreboardArchive";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ScoreboardsPage() {
  const t = useTranslations("Scoreboard");
  const {
    activeScoreboard,
    activeScoreboardId,
    archivedScoreboards,
    archive,
    hasNoWorkspace,
    isLoading,
    pendingActionId,
    reactivate,
  } = useScoreboardArchive();

  if (isLoading) {
    return <ScoreboardsSkeleton />;
  }

  if (hasNoWorkspace) {
    return <ScoreboardsNoWorkspaceState />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-pretendard">
      {pendingActionId !== null && (
        <LoadingOverlay message={t("changingStatus")} />
      )}
      <div className="max-w-[1200px] mx-auto p-6 md:p-10 lg:p-12 space-y-10 animate-linear-in">
        <ScoreboardsHeader />
        <ActiveScoreboardSection
          activeScoreboard={activeScoreboard}
          activeScoreboardId={activeScoreboardId}
          onArchive={(id) => {
            void archive(id);
          }}
          pendingActionId={pendingActionId}
        />
        <ArchivedScoreboardsSection
          archivedScoreboards={archivedScoreboards}
          onReactivate={(id) => {
            void reactivate(id);
          }}
          pendingActionId={pendingActionId}
        />
      </div>
    </div>
  );
}

function ScoreboardsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-pretendard">
      <div className="max-w-[1200px] mx-auto p-6 md:p-10 lg:p-12 space-y-10 animate-pulse">
        <div className="h-16 rounded-content bg-sub-background" />
        <div className="h-44 rounded-content bg-sub-background" />
        <div className="h-72 rounded-content bg-sub-background" />
      </div>
    </div>
  );
}

function ScoreboardsNoWorkspaceState() {
  const t = useTranslations("Scoreboard");
  const td = useTranslations("Dashboard");
  return (
    <div className="min-h-screen bg-slate-50/50 font-pretendard flex items-center justify-center p-8">
      <div className="max-w-[420px] w-full space-y-10 animate-linear-in">
        <div className="w-14 h-14 bg-primary/10 rounded-content flex items-center justify-center">
          <Zap className="text-primary w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {td("noWorkspaceTitle")}
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            {t("noWorkspaceArchiveDesc")}
          </p>
        </div>
        <NoWorkspaceActions />
      </div>
    </div>
  );
}
