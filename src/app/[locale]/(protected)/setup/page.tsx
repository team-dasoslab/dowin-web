"use client";

import { GoalSection } from "@/app/[locale]/(protected)/setup/_components/GoalSection";
import { LagMeasureSection } from "@/app/[locale]/(protected)/setup/_components/LagMeasureSection";
import { LeadMeasuresSection } from "@/app/[locale]/(protected)/setup/_components/LeadMeasuresSection";
import { SetupCoachmark } from "@/app/[locale]/(protected)/setup/_components/SetupCoachmark";
import { SetupGuideCard } from "@/app/[locale]/(protected)/setup/_components/SetupGuideCard";
import { SetupManageSection } from "@/app/[locale]/(protected)/setup/_components/SetupManageSection";
import { SetupSubmitButton } from "@/app/[locale]/(protected)/setup/_components/SetupSubmitButton";
import { useScoreboardSetup } from "@/app/[locale]/(protected)/setup/_hooks/useScoreboardSetup";
import {
  SETUP_COACHMARK_LEAD_TAGS_QUERY,
  SETUP_COACHMARK_STORAGE_KEY,
} from "@/app/[locale]/(protected)/setup/_lib/setup-coachmark";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "../_components/ProtectedPageShell";

export default function SetupPage() {
  const t = useTranslations("Setup");
  const router = useRouter();
  const [isCoachmarkRunning, setIsCoachmarkRunning] = useState(false);
  const [coachmarkMode, setCoachmarkMode] = useState<
    "default" | typeof SETUP_COACHMARK_LEAD_TAGS_QUERY
  >("default");
  const {
    addMeasureRow,
    availableTags,
    archive,
    archiveMeasureRow,
    createTag,
    deleteTag,
    goalName,
    handleMeasureChange,
    isArchivePending,
    isInitializing,
    isEditMode,
    isRedirecting,
    isTagMutationPending,
    lagMeasure,
    measures,
    monthlyTargetMax,
    reactivateMeasureRow,
    renameTag,
    removeMeasureRow,
    setGoalName,
    setLagMeasure,
    isSubmitPending,
    submit,
    toggleMeasureTag,
  } = useScoreboardSetup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit().then((isSuccess) => {
      if (isSuccess) {
        router.push("/dashboard/my");
      }
    });
  };

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const coachmark = currentUrl.searchParams.get("coachmark");

    if (coachmark === SETUP_COACHMARK_LEAD_TAGS_QUERY) {
      setCoachmarkMode(SETUP_COACHMARK_LEAD_TAGS_QUERY);
      setIsCoachmarkRunning(true);
      currentUrl.searchParams.delete("coachmark");
      window.history.replaceState(
        {},
        "",
        currentUrl.pathname + currentUrl.search,
      );
      return;
    }

    const isDismissed =
      localStorage.getItem(SETUP_COACHMARK_STORAGE_KEY) === "1";
    if (!isDismissed) {
      setCoachmarkMode("default");
      setIsCoachmarkRunning(true);
    }
  }, []);

  const [activeSection, setActiveSection] = useState("dowin");

  const menuGroups = useMemo(
    () => [
      { id: "dowin", label: t("dowinShort") },
      { id: "lag", label: t("lagMeasureLabel") },
      { id: "lead", label: t("leadMeasureHead") },
      ...(isEditMode ? [{ id: "manage", label: t("manage") }] : []),
    ],
    [isEditMode, t],
  );

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById("main-scroll-container");
      if (!container) return;
      const scrollPosition = container.scrollTop + 150;
      let currentSectionId = activeSection;

      const sectionIds = menuGroups.map((group) => group.id);
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPosition) {
          currentSectionId = id;
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

  if (isRedirecting) {
    return null;
  }

  if (isInitializing) {
    return <SetupSkeleton />;
  }

  const isMutating = isSubmitPending || isArchivePending;

  return (
    <div className="min-h-screen bg-zinc-50/50 ">
      <SetupCoachmark
        isRunning={isCoachmarkRunning}
        mode={coachmarkMode}
        setIsRunning={setIsCoachmarkRunning}
      />
      {isMutating && (
        <LoadingOverlay
          message={
            isArchivePending
              ? t("archiving")
              : isEditMode
                ? t("saving")
                : t("creating")
          }
        />
      )}
      <ProtectedPageContainer className="space-y-6 lg:space-y-12">
        <ProtectedPageHeader
          title={isEditMode ? t("editTitle") : t("createTitle")}
          description={t("description")}
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12 items-start">
          {/* ── 좌측 네비게이션 & 액션 ── */}
          <aside className="sticky top-0 z-20 -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto border-y border-zinc-200/60 bg-slate-50/95 px-4 py-2 backdrop-blur lg:top-12 lg:z-auto lg:mx-0 lg:block lg:w-[240px] lg:space-y-8 lg:overflow-visible lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <nav className="flex gap-1 lg:block lg:space-y-1">
              {menuGroups.map((group) => {
                const isActive = activeSection === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      const element = document.getElementById(group.id);
                        const container = document.getElementById("main-scroll-container");
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
                        : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50"
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

            <div className="hidden space-y-8 lg:block">
              <SetupGuideCard />
            </div>
          </aside>

          {/* ── 우측 메인 콘텐츠 ── */}
          <form
            id="setup-form"
            onSubmit={handleSubmit}
            className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12 pb-24 lg:pb-[60vh]"
          >
            {/* Dowin 섹션 */}
            <section id="dowin" className="space-y-5 scroll-mt-28">
              <SectionHeader title={t("dowinShort")} />
              <GoalSection
                goalName={goalName}
                isMutating={isMutating}
                setGoalName={setGoalName}
              />
            </section>

            {/* 결과지표 섹션 */}
            <section id="lag" className="space-y-5 scroll-mt-28">
              <SectionHeader title={t("lagMeasureLabel")} />
              <LagMeasureSection
                isMutating={isMutating}
                lagMeasure={lagMeasure}
                setLagMeasure={setLagMeasure}
              />
            </section>

            {/* 행동지표 섹션 */}
            <section id="lead" className="space-y-5 scroll-mt-28">
              <SectionHeader title={t("leadMeasureHead")} />
              <LeadMeasuresSection
                addMeasureRow={addMeasureRow}
                availableTags={availableTags}
                coachmarkTarget={
                  coachmarkMode === SETUP_COACHMARK_LEAD_TAGS_QUERY &&
                  isCoachmarkRunning
                    ? SETUP_COACHMARK_LEAD_TAGS_QUERY
                    : null
                }
                createTag={createTag}
                deleteTag={deleteTag}
                handleMeasureChange={handleMeasureChange}
                archiveMeasureRow={archiveMeasureRow}
                isMutating={isMutating}
                isTagMutationPending={isTagMutationPending}
                measures={measures}
                monthlyTargetMax={monthlyTargetMax}
                reactivateMeasureRow={reactivateMeasureRow}
                renameTag={renameTag}
                removeMeasureRow={removeMeasureRow}
                toggleMeasureTag={toggleMeasureTag}
              />
            </section>

            {/* 관리 섹션 (수정 모드일 때만) */}
            {isEditMode && (
              <section id="manage" className="space-y-5 scroll-mt-28">
                <SectionHeader title={t("manage")} />
                <SetupManageSection
                  archive={archive}
                  isArchivePending={isArchivePending}
                  isMutating={isMutating}
                />
              </section>
            )}

            <div className="border-t border-zinc-200/60 pt-6">
              <SetupSubmitButton
                isEditMode={isEditMode}
                isMutating={isMutating}
                isSubmitPending={isSubmitPending}
              />
            </div>
          </form>
        </div>
      </ProtectedPageContainer>
    </div>

  );
}

function SetupSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50/50 ">
      <div className="max-w-[1200px] mx-auto p-4 md:p-10 lg:p-12 space-y-10 animate-pulse">
        <div className="h-10 rounded-content bg-sub-background" />
        <div className="h-12 rounded-content bg-sub-background" />
        <div className="h-44 rounded-content bg-sub-background" />
        <div className="h-44 rounded-content bg-sub-background" />
        <div className="h-64 rounded-content bg-sub-background" />
      </div>
    </div>
  );
}
