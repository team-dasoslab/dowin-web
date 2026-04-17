"use client";

import { GoalSection } from "@/app/[locale]/(protected)/setup/_components/GoalSection";
import { LagMeasureSection } from "@/app/[locale]/(protected)/setup/_components/LagMeasureSection";
import { LeadMeasuresSection } from "@/app/[locale]/(protected)/setup/_components/LeadMeasuresSection";
import { SetupCoachmark } from "@/app/[locale]/(protected)/setup/_components/SetupCoachmark";
import { SetupManageSection } from "@/app/[locale]/(protected)/setup/_components/SetupManageSection";
import { SetupSubmitButton } from "@/app/[locale]/(protected)/setup/_components/SetupSubmitButton";
import { useScoreboardSetup } from "@/app/[locale]/(protected)/setup/_hooks/useScoreboardSetup";
import {
  SETUP_COACHMARK_LEAD_TAGS_QUERY,
  SETUP_COACHMARK_STORAGE_KEY,
} from "@/app/[locale]/(protected)/setup/_lib/setup-coachmark";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function SetupPage() {
  const t = useTranslations("Setup");
  const router = useRouter();
  const [isCoachmarkRunning, setIsCoachmarkRunning] = useState(false);
  const [coachmarkMode, setCoachmarkMode] = useState<
    "default" | typeof SETUP_COACHMARK_LEAD_TAGS_QUERY
  >("default");
  const {
    activeTooltip,
    addMeasureRow,
    availableTags,
    archive,
    createTag,
    deleteTag,
    goalName,
    handleMeasureChange,
    isArchivePending,
    isInitializing,
    isEditMode,
    isTagMutationPending,
    lagMeasure,
    measures,
    monthlyTargetMax,
    renameTag,
    removeMeasureRow,
    setActiveTooltip,
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

  if (isInitializing) {
    return <SetupSkeleton />;
  }

  const isMutating = isSubmitPending || isArchivePending;

  return (
    <div className="min-h-screen bg-background font-pretendard">
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
      <div className="max-w-[580px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        {/* ── 헤더 ── */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SmartBackButton className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors" />
          </div>
          <p className="text-xs text-text-muted">{t("header")}</p>
          <div className="w-8" />
        </header>

        {/* ── 페이지 타이틀 ── */}
        <div className="space-y-1 px-0.5">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            {isEditMode ? t("editTitle") : t("createTitle")}
          </h1>
          <p className="text-xs text-text-muted leading-relaxed">
            {t("description")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <GoalSection
            goalName={goalName}
            isMutating={isMutating}
            setGoalName={setGoalName}
          />

          <LagMeasureSection
            activeTooltip={activeTooltip}
            isMutating={isMutating}
            lagMeasure={lagMeasure}
            setActiveTooltip={setActiveTooltip}
            setLagMeasure={setLagMeasure}
          />

          <LeadMeasuresSection
            activeTooltip={activeTooltip}
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
            isMutating={isMutating}
            isTagMutationPending={isTagMutationPending}
            measures={measures}
            monthlyTargetMax={monthlyTargetMax}
            renameTag={renameTag}
            removeMeasureRow={removeMeasureRow}
            setActiveTooltip={setActiveTooltip}
            toggleMeasureTag={toggleMeasureTag}
          />

          <SetupSubmitButton
            isEditMode={isEditMode}
            isMutating={isMutating}
            isSubmitPending={isSubmitPending}
          />

          {isEditMode ? (
            <SetupManageSection
              archive={archive}
              isArchivePending={isArchivePending}
              isMutating={isMutating}
            />
          ) : null}
        </form>
      </div>
    </div>
  );
}

function SetupSkeleton() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[580px] mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-10 rounded-xl bg-sub-background" />
        <div className="h-12 rounded-xl bg-sub-background" />
        <div className="h-44 rounded-2xl bg-sub-background" />
        <div className="h-44 rounded-2xl bg-sub-background" />
        <div className="h-64 rounded-2xl bg-sub-background" />
      </div>
    </div>
  );
}
