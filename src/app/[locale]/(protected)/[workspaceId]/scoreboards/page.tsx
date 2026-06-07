"use client";

import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { PageSidebarNav } from "@/components/PageSidebarNav";
import { ActiveScoreboardSection } from "@/app/[locale]/(protected)/[workspaceId]/scoreboards/_components/ActiveScoreboardSection";
import { ArchivedScoreboardsSection } from "@/app/[locale]/(protected)/[workspaceId]/scoreboards/_components/ArchivedScoreboardsSection";
import { useScoreboardArchive } from "@/app/[locale]/(protected)/[workspaceId]/scoreboards/_hooks/useScoreboardArchive";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Logo } from "@/components/ui/Logo";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

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

  const [activeSection, setActiveSection] = useState("active");

  const menuGroups = useMemo(
    () => [
      { id: "active", label: t("currentActive") },
      { id: "archived", label: t("archivedScoreboards") },
    ],
    [t],
  );

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById("main-scroll-container");
      if (!container) return;
      const scrollPosition = container.scrollTop + 150;
      let currentSectionId = activeSection;

      for (const group of menuGroups) {
        const el = document.getElementById(group.id);
        if (el && el.offsetTop <= scrollPosition) {
          currentSectionId = group.id;
        }
      }

      if (currentSectionId !== activeSection) {
        setActiveSection(currentSectionId);
      }
    };

    const container = document.getElementById("main-scroll-container");
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [activeSection, menuGroups]);

  if (isLoading) {
    return <ScoreboardsSkeleton />;
  }

  if (hasNoWorkspace) {
    return <ScoreboardsNoWorkspaceState />;
  }

  return (
    <div className="min-h-screen bg-zinc-100">
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
            items={menuGroups.map((group) => ({ id: group.id, label: group.label }))}
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
                  <div className="px-2.5 py-1 rounded-[12px] bg-zinc-200/50 text-[11px] font-black text-zinc-500 uppercase tracking-tight">
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
    <div className="min-h-screen bg-zinc-100">
      <div className="max-w-[1200px] mx-auto p-4 md:p-10 lg:p-12 space-y-10 animate-pulse">
        <div className="h-16 rounded-[24px] bg-zinc-200" />
        <div className="h-44 rounded-[24px] bg-zinc-200" />
        <div className="h-72 rounded-[24px] bg-zinc-200" />
      </div>
    </div>
  );
}

function ScoreboardsNoWorkspaceState() {
  const t = useTranslations("Scoreboard");
  const td = useTranslations("Dashboard");
  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-8">
      <div className="max-w-[420px] w-full space-y-10 animate-dowin-in">
        <div className="w-14 h-14 bg-primary/10 rounded-content flex items-center justify-center">
          <Logo className="text-primary" size="28px" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            {td("noWorkspaceTitle")}
          </h1>
          <p className="text-[14px] font-medium text-zinc-500 leading-relaxed">
            {t("noWorkspaceArchiveDesc")}
          </p>
        </div>
        <NoWorkspaceActions />
      </div>
    </div>
  );
}
