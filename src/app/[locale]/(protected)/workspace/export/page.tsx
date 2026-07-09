"use client";

import { EmptyStatePanel } from "@/app/[locale]/(protected)/_components/EmptyStatePanel";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { useProfileExportAction } from "@/app/[locale]/(protected)/workspace/export/_hooks/useProfileExportAction";
import { useProfileExportData } from "@/app/[locale]/(protected)/workspace/export/_hooks/useProfileExportData";
import { useProfileExportForm } from "@/app/[locale]/(protected)/workspace/export/_hooks/useProfileExportForm";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { useNativeApp } from "@/context/NativeAppContext";
import { Link } from "@/i18n/routing";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function ProfileExportPage() {
  const isNativeApp = useNativeApp();
  const {
    activeScoreboard,
    exportMeasureOptions,
    hasNoScoreboard,
    hasNoWorkspace,
    isLoading,
    workspace,
  } = useProfileExportData();
  const isExportAvailable = true;
  const {
    exportFrom,
    exportTo,
    handleExportFromChange,
    handleExportToChange,
    isAllMeasuresSelected,
    selectedExportMeasureIds,
    splitByWeek,
    toggleExportMeasure,
    toggleSelectAllMeasures,
    toggleSplitByWeek,
  } = useProfileExportForm({
    exportMeasureOptions,
  });
  const { exportCsv, isExporting } = useProfileExportAction({
    workspaceId: workspace?.id?.toString(),
    exportFrom,
    exportTo,
    selectedExportMeasureIds,
    splitByWeek,
  });

  if (isLoading) {
    return <ExportSkeleton />;
  }

  if (isNativeApp) {
    return <ExportUnavailableInAppState />;
  }

  if (hasNoWorkspace) {
    return <NoWorkspaceState />;
  }

  if (hasNoScoreboard || !activeScoreboard) {
    return <NoScoreboardState />;
  }

  return (
    <div className="min-h-screen">
      <ProtectedPageContainer className="max-w-[640px] pb-24 md:pb-10 lg:pb-12">
        <ProtectedPageHeader title="데이터 내보내기" />





        <div className="rounded-[24px] bg-surface p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-[15px] font-black text-text-primary">
              내보내기 조건
            </h2>
            <p className="text-[12px] font-medium text-text-muted">
              기간(최대 92일)과 선행지표를 선택해 CSV 파일로 내려받습니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex h-11 min-w-0 items-center gap-2 rounded-[16px] bg-sub-background px-4 text-xs text-text-secondary">
              <span className="shrink-0 text-[12px] font-bold">시작일</span>
              <input
                type="date"
                value={exportFrom}
                onChange={(event) => handleExportFromChange(event.target.value)}
                className="min-w-0 flex-1 bg-transparent font-mono text-[13px] font-black text-text-primary outline-none"
              />
            </label>
            <label className="flex h-11 min-w-0 items-center gap-2 rounded-[16px] bg-sub-background px-4 text-xs text-text-secondary">
              <span className="shrink-0 text-[12px] font-bold">종료일</span>
              <input
                type="date"
                value={exportTo}
                onChange={(event) => handleExportToChange(event.target.value)}
                className="min-w-0 flex-1 bg-transparent font-mono text-[13px] font-black text-text-primary outline-none"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-bold text-text-muted">
                선행지표 선택
              </p>
              <Button
                type="button"
                onClick={toggleSelectAllMeasures}
                variant="subtle"
                size="sm"
                className="h-8 rounded-[12px] px-3 text-[11px] font-black"
              >
                {isAllMeasuresSelected ? "전체 해제" : "전체 선택"}
              </Button>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {exportMeasureOptions.map((measure) => {
                const checked = selectedExportMeasureIds.includes(measure.id);

                return (
                  <label
                    key={measure.id}
                    className="flex items-center gap-2 rounded-[12px] bg-sub-background px-3 py-2 text-[13px] font-bold text-text-primary"
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleExportMeasure(measure.id)}
                      size="sm"
                    />
                    <span className="truncate">{measure.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-[12px] border-none bg-sub-background px-3 py-2 text-xs text-text-secondary">
            <Checkbox
              checked={splitByWeek}
              onChange={(event) => toggleSplitByWeek(event.target.checked)}
              size="sm"
            />
            <span>주차별로 섹션 분리해서 내보내기</span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
            <p className="text-[12px] font-medium text-text-muted">
              선택 지표 {selectedExportMeasureIds.length}개
            </p>
            <Button
              type="button"
              onClick={() => void exportCsv()}
              disabled={isExporting || !isExportAvailable}
              variant="primary"
              size="sm"
              className="w-full sm:w-auto rounded-[12px] gap-1.5"
            >
              <DowinIcon name="action-download" size="14px" />
              {isExportAvailable
                ? isExporting
                  ? "CSV 생성 중..."
                  : "CSV 다운로드"
                : "현재 사용 불가"}
            </Button>
          </div>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}

function ExportUnavailableInAppState() {
  const t = useTranslations("ProfileExport");
  const workspaceId = useParams().workspaceId as string | undefined;

  return (
    <div className="min-h-screen">
      <div className="max-w-[680px] mx-auto p-4 md:p-8 space-y-10 animate-dowin-in">
        <ProfileExportHeader />
        <EmptyStatePanel
          title={t("appUnavailableTitle")}
          description={t("appUnavailableDesc")}
          actions={
            <Button
              asChild
              variant="subtle"
              size="primary"
              className="w-fit rounded-[16px] font-black text-text-primary"
            >
              <Link href={getWorkspacePath(workspaceId, "/profile")}>
                {t("appUnavailableAction")}
              </Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}

function ProfileExportHeader() {
  return (
    <header className="flex items-center justify-between">
      <SmartBackButton />
      <p className="text-[13px] font-bold text-text-muted">데이터 내보내기</p>
      <div className="w-8" />
    </header>
  );
}

function ExportSkeleton() {
  return (
    <div className="min-h-screen">
      <ProtectedPageContainer
        isLoading
        className="max-w-[640px] pb-24 md:pb-10 lg:pb-12"
      >
        <div className="h-10 rounded-[16px] bg-border" />
        <div className="h-24 rounded-[24px] bg-border" />
        <div className="h-[420px] rounded-[24px] bg-border" />
      </ProtectedPageContainer>
    </div>
  );
}

function NoWorkspaceState() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[680px] mx-auto p-4 md:p-8 space-y-10 animate-dowin-in">
        <ProfileExportHeader />
        <EmptyStatePanel
          title="소속된 워크스페이스가 없어요"
          description={
            <>
              CSV를 내보내기 전에 먼저 워크스페이스를 만들거나
              <br />
              초대받은 팀에 참여해주세요.
            </>
          }
          actions={<NoWorkspaceActions />}
        />
      </div>
    </div>
  );
}

function NoScoreboardState() {
  const workspaceId = useParams().workspaceId as string | undefined;
  return (
    <div className="min-h-screen">
      <div className="max-w-[680px] mx-auto p-4 md:p-8 space-y-10 animate-dowin-in">
        <ProfileExportHeader />
        <EmptyStatePanel
          title="아직 핵심 목표가 없어요"
          description={
            <>
              먼저 점수판을 만들고 선행지표를 기록하면
              <br />
              기간별 데이터를 CSV로 내려받을 수 있어요.
            </>
          }
          actions={
            <Button
              asChild
              variant="primary"
              size="primary"
              className="w-fit gap-2"
            >
              <Link href={getWorkspacePath(workspaceId, "/setup?mode=create")}>
                새 점수판 만들기
              </Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
