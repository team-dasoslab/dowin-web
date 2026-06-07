"use client";

import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
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
          {/* ── 좌측 네비게이션 ── */}
          <aside className="scrollbar-none sticky top-0 z-20 -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto border-y border-zinc-200/60 bg-zinc-50/95 px-4 py-2 backdrop-blur lg:top-12 lg:z-auto lg:mx-0 lg:block lg:w-[240px] lg:space-y-1 lg:overflow-visible lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <nav className="flex gap-1 lg:block lg:space-y-1">
              {menuGroups.map((group) => {
                const isActive = activeSection === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      const element = document.getElementById(group.id);
                      const container = document.getElementById(
                        "main-scroll-container",
                      );
                      if (container && element) {
                        const headerOffset = 100;
                        const elementPosition = element.offsetTop;
                        const offsetPosition = elementPosition - headerOffset;
                        container.scrollTo({
                          top: offsetPosition,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className={`flex shrink-0 items-center rounded-button px-3 py-2 text-left text-[13px] font-bold transition-all lg:w-full lg:px-4 lg:text-[14px] ${
                      isActive
                        ? "text-primary"
                        : "text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isActive && (
                        <div className="hidden w-1 h-4 bg-primary rounded-full lg:block" />
                      )}
                      <span className={isActive ? "" : "lg:pl-4"}>
                        {group.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

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
                  <div className="px-2 py-0.5 rounded-md border border-border bg-sub-background text-[10px] font-black text-text-muted uppercase tracking-tight">
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
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-8">
      <div className="max-w-[420px] w-full space-y-10 animate-dowin-in">
        <div className="w-14 h-14 bg-primary/10 rounded-content flex items-center justify-center">
          <Logo className="text-primary" size="28px" />
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
