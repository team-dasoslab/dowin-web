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

import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { PageSidebarNav } from "@/components/PageSidebarNav";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function SetupPage() {
  const t = useTranslations("Setup");
  const router = useRouter();
  const workspaceId = useParams().workspaceId as string | undefined;
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
    restoreMeasureRow,
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
        router.push(workspaceId ? `/${workspaceId}/dashboard/my` : "/");
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
    <div className="min-h-screen bg-zinc-100">
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
          <PageSidebarNav
            items={menuGroups.map((group) => ({
              id: group.id,
              label: group.label,
            }))}
            activeId={activeSection}
            bottomContent={<SetupGuideCard />}
          />

          {/* ── 우측 메인 콘텐츠 ── */}
          <form
            id="setup-form"
            onSubmit={handleSubmit}
            className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12 pb-24 lg:pb-[60vh]"
          >
            {/* Dowin 섹션 */}
            <section id="dowin" className="space-y-4 scroll-mt-28">
              <SectionHeader title={t("dowinShort")} />
              <GoalSection
                goalName={goalName}
                isMutating={isMutating}
                setGoalName={setGoalName}
              />
            </section>

            {/* 결과지표 섹션 */}
            <section id="lag" className="space-y-4 scroll-mt-28">
              <SectionHeader title={t("lagMeasureLabel")} />
              <LagMeasureSection
                isMutating={isMutating}
                lagMeasure={lagMeasure}
                setLagMeasure={setLagMeasure}
              />
            </section>

            {/* 행동지표 섹션 */}
            <section id="lead" className="space-y-4 scroll-mt-28">
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
                restoreMeasureRow={restoreMeasureRow}
                toggleMeasureTag={toggleMeasureTag}
              />
            </section>

            {/* 관리 섹션 (수정 모드일 때만) */}
            {isEditMode && (
              <section id="manage" className="space-y-4 scroll-mt-28">
                <SectionHeader title={t("manage")} />
                <SetupManageSection
                  archive={archive}
                  isArchivePending={isArchivePending}
                />
              </section>
            )}

            <div className="pt-8 pb-safe lg:p-0 lg:pt-8">
              <div className="mx-auto max-w-[800px]">
                <SetupSubmitButton
                  isEditMode={isEditMode}
                  isMutating={isMutating}
                  isSubmitPending={isSubmitPending}
                />
              </div>
            </div>
          </form>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}

function SetupSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-100">
      <ProtectedPageContainer isLoading className="space-y-6 lg:space-y-12">
        <div className="space-y-4">
          <div className="h-10 w-48 rounded-[12px] bg-zinc-200" />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12 items-start">
          <div className="hidden w-[240px] space-y-2 lg:block">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-[12px] bg-zinc-200" />
            ))}
          </div>

          <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12 pb-24 lg:pb-[60vh]">
            <div className="h-32 rounded-[24px] bg-zinc-200" />
            <div className="h-32 rounded-[24px] bg-zinc-200" />
            <div className="h-64 rounded-[24px] bg-zinc-200" />
          </div>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}
