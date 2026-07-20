"use client";

import { EmptyStatePanel } from "@/app/[locale]/(protected)/_components/EmptyStatePanel";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { useProfileExportAction } from "@/app/[locale]/(protected)/settings/export/_hooks/useProfileExportAction";
import { useProfileExportData } from "@/app/[locale]/(protected)/settings/export/_hooks/useProfileExportData";
import { useProfileExportForm } from "@/app/[locale]/(protected)/settings/export/_hooks/useProfileExportForm";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { Switch } from "@/components/ui/Switch";
import { useNativeApp } from "@/context/NativeAppContext";
import { Link } from "@/i18n/routing";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function ProfileExportPage() {
  const tExport = useTranslations("ProfileExport");
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
      <ProtectedPageContainer className="max-w-[640px] pb-32">
        <ProtectedPageHeader title={tExport("csvDownloadTitle")} />

        <div className="space-y-8 mt-4 animate-dowin-in">
          {/* Section 1: Dates */}
          <section className="space-y-3">
            <div className="px-2 space-y-0.5">
              <h3 className="text-[14px] font-bold text-text-secondary">기간 선택</h3>
              <p className="text-[12px] font-medium text-text-muted">{tExport("dateRangeLimit")}</p>
            </div>
            <div className="flex flex-col rounded-[24px] bg-surface p-1">
              <label
                className="flex h-[56px] items-center justify-between rounded-[20px] px-4 cursor-pointer hover:bg-sub-background active:bg-sub-background/80 transition-colors"
                onClick={(e) => {
                  const input = e.currentTarget.querySelector("input");
                  if (input && "showPicker" in input) {
                    try {
                      input.showPicker();
                    } catch {}
                  }
                }}
              >
                <span className="text-[15px] font-bold text-text-primary">
                  {tExport("startDate")}
                </span>
                <input
                  type="date"
                  value={exportFrom}
                  onChange={(event) => handleExportFromChange(event.target.value)}
                  className="bg-transparent text-right font-mono text-[16px] font-bold text-brand-primary outline-none"
                />
              </label>
              <div className="h-[1px] w-[calc(100%-2rem)] mx-auto bg-border/40" />
              <label
                className="flex h-[56px] items-center justify-between rounded-[20px] px-4 cursor-pointer hover:bg-sub-background active:bg-sub-background/80 transition-colors"
                onClick={(e) => {
                  const input = e.currentTarget.querySelector("input");
                  if (input && "showPicker" in input) {
                    try {
                      input.showPicker();
                    } catch {}
                  }
                }}
              >
                <span className="text-[15px] font-bold text-text-primary">
                  {tExport("endDate")}
                </span>
                <input
                  type="date"
                  value={exportTo}
                  onChange={(event) => handleExportToChange(event.target.value)}
                  className="bg-transparent text-right font-mono text-[16px] font-bold text-brand-primary outline-none"
                />
              </label>
            </div>
          </section>

          {/* Section 2: Measures */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[14px] font-bold text-text-secondary">
                {tExport("selectMeasure")}{" "}
                <span className="text-brand-primary">({selectedExportMeasureIds.length})</span>
              </h3>
              <Button
                type="button"
                onClick={toggleSelectAllMeasures}
                variant="ghost-primary"
                size="sm"
              >
                {isAllMeasuresSelected ? tExport("deselectAll") : tExport("selectAll")}
              </Button>
            </div>

            <div className="rounded-[24px] bg-surface p-2 flex flex-col gap-1">
              {exportMeasureOptions.map((measure) => {
                const checked = selectedExportMeasureIds.includes(measure.id);
                return (
                  <label
                    key={measure.id}
                    className="flex h-[56px] items-center gap-3 rounded-[20px] px-4 cursor-pointer hover:bg-sub-background active:bg-sub-background/80 transition-colors"
                  >
                    <Checkbox checked={checked} onChange={() => toggleExportMeasure(measure.id)} />
                    <span className="text-[15px] font-bold text-text-primary flex-1 truncate">
                      {measure.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Section 3: Options */}
          <section className="space-y-3">
            <h3 className="px-2 text-[14px] font-bold text-text-secondary">추가 옵션</h3>
            <div className="rounded-[24px] bg-surface p-1">
              <label className="flex h-[56px] items-center justify-between rounded-[20px] px-4 cursor-pointer hover:bg-sub-background active:bg-sub-background/80 transition-colors">
                <span className="text-[15px] font-bold text-text-primary">
                  {tExport("splitByWeek")}
                </span>
                <Switch checked={splitByWeek} onCheckedChange={toggleSplitByWeek} />
              </label>
            </div>
          </section>
        </div>

        {/* Bottom Button Area */}
        <div className="mt-8 px-1">
          <Button
            type="button"
            onClick={() => void exportCsv()}
            disabled={isExporting || !isExportAvailable}
            variant="solid-dark"
            size="hero"
            className="shadow-sm"
          >
            {isExportAvailable
              ? isExporting
                ? tExport("generatingCsv")
                : tExport("csvDownloadAction")
              : tExport("currentlyUnavailable")}
          </Button>
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
  const tExport = useTranslations("ProfileExport");
  return (
    <header className="flex items-center justify-between">
      <SmartBackButton />
      <p className="text-[13px] font-bold text-text-muted">{tExport("csvDownloadTitle")}</p>
      <div className="w-8" />
    </header>
  );
}

function ExportSkeleton() {
  return (
    <div className="min-h-screen">
      <ProtectedPageContainer isLoading className="max-w-[640px] pb-24 md:pb-10 lg:pb-12">
        <div className="h-10 rounded-[16px] bg-border" />
        <div className="h-24 rounded-[24px] bg-border" />
        <div className="h-[420px] rounded-[24px] bg-border" />
      </ProtectedPageContainer>
    </div>
  );
}

function NoWorkspaceState() {
  const tExport = useTranslations("ProfileExport");
  return (
    <div className="min-h-screen">
      <div className="max-w-[680px] mx-auto p-4 md:p-8 space-y-10 animate-dowin-in">
        <ProfileExportHeader />
        <EmptyStatePanel
          title={tExport("noWorkspaceTitle")}
          description={
            <>
              {tExport("noWorkspaceDesc1")}
              <br />
              {tExport("noWorkspaceDesc2")}
            </>
          }
          actions={<NoWorkspaceActions />}
        />
      </div>
    </div>
  );
}

function NoScoreboardState() {
  const tExport = useTranslations("ProfileExport");
  const workspaceId = useParams().workspaceId as string | undefined;
  return (
    <div className="min-h-screen">
      <div className="max-w-[680px] mx-auto p-4 md:p-8 space-y-10 animate-dowin-in">
        <ProfileExportHeader />
        <EmptyStatePanel
          title={tExport("noScoreboardTitle")}
          description={
            <>
              {tExport("noScoreboardDesc1")}
              <br />
              {tExport("noScoreboardDesc2")}
            </>
          }
          actions={
            <Button asChild variant="primary" size="primary" className="w-fit gap-2">
              <Link href={getWorkspacePath(workspaceId, "/setup?mode=create")}>
                {tExport("createNewScoreboard")}
              </Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
