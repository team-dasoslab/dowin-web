"use client";

import { ActiveScoreboardSection } from "@/app/(protected)/scoreboards/_components/ActiveScoreboardSection";
import { ArchivedScoreboardsSection } from "@/app/(protected)/scoreboards/_components/ArchivedScoreboardsSection";
import { ScoreboardsHeader } from "@/app/(protected)/scoreboards/_components/ScoreboardsHeader";
import { useScoreboardArchive } from "@/app/(protected)/scoreboards/_hooks/useScoreboardArchive";
import { NoWorkspaceActions } from "@/app/(protected)/_components/NoWorkspaceActions";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Zap } from "lucide-react";

export default function ScoreboardsPage() {
  const {
    activeScoreboard,
    activeScoreboardId,
    archivedScoreboards,
    archive,
    hasNoWorkspace,
    isLoading,
    pendingActionId,
    reactivate,
    workspace,
  } = useScoreboardArchive();

  if (isLoading) {
    return <ScoreboardsSkeleton />;
  }

  if (hasNoWorkspace) {
    return <ScoreboardsNoWorkspaceState />;
  }

  return (
    <div className="min-h-screen bg-background font-pretendard">
      {pendingActionId !== null && (
        <LoadingOverlay message="점수판 상태를 변경하는 중입니다." />
      )}
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        <ScoreboardsHeader
          hasActiveScoreboard={Boolean(activeScoreboard)}
          workspaceName={workspace?.name}
        />
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
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-16 rounded-2xl bg-sub-background" />
        <div className="h-44 rounded-2xl bg-sub-background" />
        <div className="h-72 rounded-2xl bg-sub-background" />
      </div>
    </div>
  );
}

function ScoreboardsNoWorkspaceState() {
  return (
    <div className="min-h-screen bg-background font-pretendard flex items-center justify-center p-8">
      <div className="max-w-[420px] w-full space-y-8 animate-linear-in">
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
          <Zap className="text-primary w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            아직 워크스페이스가 없어요
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            점수판 보관함은 워크스페이스에 소속된 뒤부터 사용할 수 있습니다.
          </p>
        </div>
        <NoWorkspaceActions />
      </div>
    </div>
  );
}
