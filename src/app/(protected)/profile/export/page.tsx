"use client";

import { EmptyStatePanel } from "@/app/(protected)/_components/EmptyStatePanel";
import { NoWorkspaceActions } from "@/app/(protected)/_components/NoWorkspaceActions";
import { useProfileExportAction } from "@/app/(protected)/profile/export/_hooks/useProfileExportAction";
import { useProfileExportData } from "@/app/(protected)/profile/export/_hooks/useProfileExportData";
import { useProfileExportForm } from "@/app/(protected)/profile/export/_hooks/useProfileExportForm";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { Download, Plus } from "lucide-react";
import Link from "next/link";

export default function ProfileExportPage() {
  const {
    activeScoreboard,
    exportMeasureOptions,
    hasNoScoreboard,
    hasNoWorkspace,
    isLoading,
    user,
    workspace,
  } = useProfileExportData();
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
    exportFrom,
    exportTo,
    selectedExportMeasureIds,
    splitByWeek,
  });

  if (isLoading) {
    return <ExportSkeleton />;
  }

  if (hasNoWorkspace) {
    return <NoWorkspaceState />;
  }

  if (hasNoScoreboard || !activeScoreboard) {
    return <NoScoreboardState />;
  }

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[680px] mx-auto p-4 md:p-8 space-y-6 animate-linear-in">
        <ProfileExportHeader />

        <Card className="border border-border rounded-lg px-6 py-5 flex items-center gap-4">
          <UserAvatar
            avatarKey={user?.avatarKey}
            alt={`${user?.nickname ?? "사용자"} 아바타`}
            size={44}
            className="flex-shrink-0"
            fallbackClassName="rounded-lg"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              {user?.nickname ?? "사용자"}님의 CSV 다운로드
            </h1>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {workspace?.name}
            </p>
          </div>
        </Card>

        <Card className="border border-border rounded-lg p-4 space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">
              내보내기 조건
            </h2>
            <p className="text-[11px] text-text-muted">
              기간(최대 92일)과 선행지표를 선택해 CSV 파일로 내려받습니다.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs text-text-secondary">
              <span className="shrink-0 text-[11px]">시작일</span>
              <input
                type="date"
                value={exportFrom}
                onChange={(event) => handleExportFromChange(event.target.value)}
                className="min-w-0 flex-1 bg-transparent font-mono text-text-primary outline-none"
              />
            </label>
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs text-text-secondary">
              <span className="shrink-0 text-[11px]">종료일</span>
              <input
                type="date"
                value={exportTo}
                onChange={(event) => handleExportToChange(event.target.value)}
                className="min-w-0 flex-1 bg-transparent font-mono text-text-primary outline-none"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-text-muted">
                선행지표 선택
              </p>
              <Button
                type="button"
                onClick={toggleSelectAllMeasures}
                className="h-7 rounded-lg border border-border bg-white px-2.5 text-[11px] font-bold text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-primary"
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
                    className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-xs text-text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExportMeasure(measure.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="truncate">{measure.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-border bg-sub-background px-3 py-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={splitByWeek}
              onChange={(event) => toggleSplitByWeek(event.target.checked)}
              className="h-3.5 w-3.5"
            />
            <span>주차별로 섹션 분리해서 내보내기</span>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-text-muted">
              선택 지표 {selectedExportMeasureIds.length}개
            </p>
            <Button
              type="button"
              onClick={() => void exportCsv()}
              disabled={isExporting}
              className="h-9 w-full rounded-lg bg-primary px-4 text-xs font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? "CSV 생성 중..." : "CSV 다운로드"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProfileExportHeader() {
  return (
    <header className="flex items-center justify-between">
      <SmartBackButton className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors" />
      <p className="text-xs text-text-muted">데이터 내보내기</p>
      <div className="w-8" />
    </header>
  );
}

function ExportSkeleton() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[680px] mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-10 rounded-xl bg-sub-background" />
        <div className="h-24 rounded-2xl bg-sub-background" />
        <div className="h-[420px] rounded-2xl bg-sub-background" />
      </div>
    </div>
  );
}

function NoWorkspaceState() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[680px] mx-auto p-4 md:p-8 space-y-10 animate-linear-in">
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
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[680px] mx-auto p-4 md:p-8 space-y-10 animate-linear-in">
        <ProfileExportHeader />
        <EmptyStatePanel
          title="아직 가중목이 없어요"
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
              className="btn-linear-primary flex items-center gap-2 w-fit px-5 py-3 text-sm"
            >
              <Link href="/setup?mode=create">
                <Plus className="w-4 h-4" />새 점수판 만들기
              </Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
