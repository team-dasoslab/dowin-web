"use client";

import { ActiveScoreboardSection } from "@/app/[locale]/(protected)/[workspaceId]/scoreboards/_components/ActiveScoreboardSection";
import { ArchivedScoreboardsSection } from "@/app/[locale]/(protected)/[workspaceId]/scoreboards/_components/ArchivedScoreboardsSection";
import { useScoreboardArchive } from "@/app/[locale]/(protected)/[workspaceId]/scoreboards/_hooks/useScoreboardArchive";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageSidebarNav } from "@/components/PageSidebarNav";
import { Logo } from "@/components/ui/Logo";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useActiveSectionScroll } from "@/hooks/useActiveSectionScroll";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

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

  const menuGroups = useMemo(
    () => [
      { id: "active", label: t("currentActive") },
      { id: "archived", label: t("archivedScoreboards") },
    ],
    [t],
  );

  const [activeSection] = useActiveSectionScroll(
    menuGroups,
    "active",
  );

  if (isLoading) {
    return <ScoreboardsSkeleton />;
  }

  if (hasNoWorkspace) {
    return <ScoreboardsNoWorkspaceState />;
  }

  return (
    <div className="min-h-screen">
      {pendingActionId !== null && (
        <LoadingOverlay message={t("changingStatus")} />
      )}
      <ProtectedPageContainer className="space-y-6 lg:space-y-12">
        <ProtectedPageHeader
          title={t("archiveTitle")}
          description={t("archiveDesc")}
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12 items-start">
          <PageSidebarNav
            items={menuGroups.map((group) => ({
              id: group.id,
              label: group.label,
            }))}
            activeId={activeSection}
          />

          {/* ── 우측 메인 콘텐츠 ── */}
          <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12 pb-24 lg:pb-[60vh]">
            <section id="active" className="space-y-5 scroll-mt-28">
              <SectionHeader
                title={t("currentActive")}
                description={t("onlyOneActiveDesc")}
              />
              <ActiveScoreboardSection
                activeScoreboard={activeScoreboard}
                activeScoreboardId={activeScoreboardId}
                onArchive={(id) => {
                  void archive(id);
                }}
                pendingActionId={pendingActionId}
              />
            </section>

            <section id="archived" className="space-y-5 scroll-mt-28">
              <SectionHeader
                title={t("archivedScoreboards")}
                description={t("archivedScoreboardsDesc")}
                badge={
                  <div className="px-2.5 py-1 rounded-[12px] bg-primary/10 text-[11px] font-black text-primary uppercase tracking-tight">
                    {t("totalCount", { count: archivedScoreboards.length })}
                  </div>
                }
              />
              <ArchivedScoreboardsSection
                archivedScoreboards={archivedScoreboards}
                onReactivate={(id) => {
                  void reactivate(id);
                }}
                pendingActionId={pendingActionId}
              />
            </section>
          </div>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}

function ScoreboardsSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1200px] mx-auto p-4 md:p-10 lg:p-12 space-y-10 animate-pulse">
        <div className="h-12 w-48 rounded-[12px] bg-border" />
        <div className="h-44 rounded-[24px] bg-border" />
        <div className="h-72 rounded-[24px] bg-border" />
      </div>
    </div>
  );
}

function ScoreboardsNoWorkspaceState() {
  const t = useTranslations("Scoreboard");
  const td = useTranslations("Dashboard");
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-[420px] w-full space-y-10 animate-dowin-in">
        <div className="w-14 h-14 bg-primary/10 rounded-content flex items-center justify-center">
          <Logo className="text-primary" size="28px" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            {td("noWorkspaceTitle")}
          </h1>
          <p className="text-[14px] font-medium text-text-muted leading-relaxed">
            {t("noWorkspaceArchiveDesc")}
          </p>
        </div>
        <NoWorkspaceActions />
      </div>
    </div>
  );
}
