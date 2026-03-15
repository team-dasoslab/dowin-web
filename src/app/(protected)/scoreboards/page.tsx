"use client";

import { useScoreboardArchive } from "@/app/(protected)/scoreboards/_hooks/useScoreboardArchive";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Plus,
  RotateCcw,
  Settings,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
});

const formatDate = (value?: string | null) => {
  if (!value) {
    return "날짜 미정";
  }

  const parsed = new Date(`${value}T00:00:00+09:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
};

type ScoreboardCardProps = {
  goalName?: string;
  lagMeasure?: string;
  startDate?: string;
  endDate?: string | null;
  action: React.ReactNode;
};

function ScoreboardCard({
  action,
  endDate,
  goalName,
  lagMeasure,
  startDate,
}: ScoreboardCardProps) {
  return (
    <Card className="border border-border rounded-lg p-5 space-y-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 className="text-base font-bold text-text-primary">
            {goalName || "이름 없는 점수판"}
          </h2>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Target className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <span className="leading-relaxed">
              {lagMeasure || "후행지표가 없습니다."}
            </span>
          </div>
        </div>
        {action}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
        <span className="inline-flex items-center gap-1 rounded-md bg-sub-background px-2 py-1 border border-border">
          <CalendarDays className="w-3 h-3" />
          활성 기간 {formatDate(startDate)} -{" "}
          {endDate ? formatDate(endDate) : "진행 중"}
        </span>
      </div>
    </Card>
  );
}

export default function ScoreboardsPage() {
  const {
    activeScoreboard,
    activeScoreboardId,
    archivedScoreboards,
    archive,
    hasNoWorkspace,
    isLoading,
    pendingActionId,
    reactivate,
    workspace,
  } = useScoreboardArchive();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (hasNoWorkspace) {
    return (
      <div className="min-h-screen bg-background font-pretendard flex items-center justify-center p-8">
        <div className="max-w-[420px] w-full space-y-8 animate-linear-in">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
            <Zap className="text-primary w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              아직 워크스페이스가 없어요
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              점수판 보관함은 워크스페이스에 소속된 뒤부터 사용할 수 있습니다.
            </p>
          </div>
          <Button
            asChild
            className="btn-linear-primary w-fit px-5 py-3 text-sm"
          >
            <Link href="/workspace/new">워크스페이스 만들기</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              asChild
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors shrink-0"
            >
              <Link href="/dashboard/my">
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted truncate">
                {workspace?.name}
              </p>
              <h1 className="text-lg font-bold text-text-primary truncate">
                점수판 보관함
              </h1>
              <p className="text-xs text-text-muted">
                내가 만든 점수판 전체를 보고, 활성/보관 상태를 바꿉니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeScoreboard && (
              <Button
                asChild
                className="px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5"
              >
                <Link href="/setup?mode=update">
                  <Settings className="w-3.5 h-3.5 text-text-muted" />
                  현재 점수판 수정
                </Link>
              </Button>
            )}
          </div>
        </header>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                현재 활성 점수판
              </h2>
              <p className="text-[11px] text-text-muted">
                활성 점수판은 한 번에 하나만 유지됩니다.
              </p>
            </div>
          </div>

          {activeScoreboard && activeScoreboardId ? (
            <ScoreboardCard
              goalName={activeScoreboard.goalName}
              lagMeasure={activeScoreboard.lagMeasure}
              startDate={activeScoreboard.startDate}
              endDate={activeScoreboard.endDate}
              action={
                <Button
                  type="button"
                  disabled={pendingActionId === activeScoreboardId}
                  onClick={() => {
                    if (confirm("현재 활성 점수판을 보관하시겠습니까?")) {
                      void archive(activeScoreboardId);
                    }
                  }}
                  className="px-3 py-1.5 border border-border text-text-secondary hover:border-[rgba(205,207,213,1)] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {pendingActionId === activeScoreboardId
                    ? "보관 중..."
                    : "보관"}
                </Button>
              }
            />
          ) : (
            <Card className="border border-dashed border-border rounded-lg p-8 bg-white text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg  mx-auto flex items-center justify-center">
                <Zap className="text-primary w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-primary">
                  현재 활성 점수판이 없습니다
                </p>
                <p className="text-xs text-text-muted">
                  보관된 점수판을 다시 활성화하거나 새 점수판을 만들 수
                  있습니다.
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  asChild
                  className="btn-linear-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  <Link href="/setup?mode=create">
                    <Plus className="w-3.5 h-3.5" />새 점수판 만들기
                  </Link>
                </Button>
              </div>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                보관된 점수판
              </h2>
              <p className="text-[11px] text-text-muted">
                지금까지 만든 점수판 기록을 확인하고 다시 활성화할 수 있습니다.
              </p>
            </div>
            <Badge className="px-2 py-1 rounded-md border border-border bg-sub-background text-[11px] font-bold text-text-secondary">
              총 {archivedScoreboards.length}개
            </Badge>
          </div>

          {archivedScoreboards.length === 0 ? (
            <Card className="border border-dashed border-border rounded-lg p-8 bg-white text-center text-sm text-text-muted">
              아직 보관된 점수판이 없습니다.
            </Card>
          ) : (
            <div className="space-y-3">
              {archivedScoreboards.map((scoreboard) => {
                const scoreboardId = toNumber(scoreboard.id);

                return (
                  <ScoreboardCard
                    key={scoreboard.id ?? scoreboard.goalName}
                    goalName={scoreboard.goalName}
                    lagMeasure={scoreboard.lagMeasure}
                    startDate={scoreboard.startDate}
                    endDate={scoreboard.endDate}
                    action={
                      <Button
                        type="button"
                        disabled={
                          !scoreboardId || pendingActionId === scoreboardId
                        }
                        onClick={() => {
                          if (!scoreboardId) {
                            return;
                          }

                          void reactivate(scoreboardId);
                        }}
                        className="px-3 py-1.5 border border-border text-text-secondary hover:border-[rgba(205,207,213,1)] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {pendingActionId === scoreboardId
                          ? "활성화 중..."
                          : "다시 활성화"}
                      </Button>
                    }
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const toNumber = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
