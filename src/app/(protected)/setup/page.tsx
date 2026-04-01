"use client";

import { GoalSection } from "@/app/(protected)/setup/_components/GoalSection";
import { LagMeasureSection } from "@/app/(protected)/setup/_components/LagMeasureSection";
import { LeadMeasuresSection } from "@/app/(protected)/setup/_components/LeadMeasuresSection";
import { SetupCoachmark } from "@/app/(protected)/setup/_components/SetupCoachmark";
import { SetupManageSection } from "@/app/(protected)/setup/_components/SetupManageSection";
import { SetupSubmitButton } from "@/app/(protected)/setup/_components/SetupSubmitButton";
import { useScoreboardSetup } from "@/app/(protected)/setup/_hooks/useScoreboardSetup";
import { SETUP_COACHMARK_STORAGE_KEY } from "@/app/(protected)/setup/_lib/setup-coachmark";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SetupPage() {
  const router = useRouter();
  const [isCoachmarkRunning, setIsCoachmarkRunning] = useState(false);
  const {
    activeTooltip,
    addMeasureRow,
    archive,
    goalName,
    handleMeasureChange,
    isArchivePending,
    isInitializing,
    isEditMode,
    lagMeasure,
    measures,
    monthlyTargetMax,
    removeMeasureRow,
    setActiveTooltip,
    setGoalName,
    setLagMeasure,
    isSubmitPending,
    submit,
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
    const isDismissed =
      localStorage.getItem(SETUP_COACHMARK_STORAGE_KEY) === "1";
    if (!isDismissed) {
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
        setIsRunning={setIsCoachmarkRunning}
      />
      {isMutating && (
        <LoadingOverlay
          message={
            isArchivePending
              ? "점수판을 보관하는 중입니다."
              : isEditMode
                ? "점수판 변경사항을 저장하는 중입니다."
                : "새 점수판을 만드는 중입니다."
          }
        />
      )}
      <div className="max-w-[580px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        {/* ── 헤더 ── */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SmartBackButton className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors" />
          </div>
          <p className="text-xs text-text-muted">점수판 설정</p>
          <div className="w-8" />
        </header>

        {/* ── 페이지 타이틀 ── */}
        <div className="space-y-1 px-0.5">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            {isEditMode ? "현재 목표 수정" : "다음 점수판 정하기"}
          </h1>
          <p className="text-xs text-text-muted leading-relaxed">
            하나의 목표(WIG) · 성공 척도(후행지표) · 핵심 행동(선행지표)을
            설정하세요.
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
            handleMeasureChange={handleMeasureChange}
            isMutating={isMutating}
            measures={measures}
            monthlyTargetMax={monthlyTargetMax}
            removeMeasureRow={removeMeasureRow}
            setActiveTooltip={setActiveTooltip}
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
