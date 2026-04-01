"use client";

import { ScoreboardCard } from "@/app/(protected)/scoreboards/_components/ScoreboardCard";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Archive, Plus, Zap } from "lucide-react";
import Link from "next/link";

type ScoreboardSummary = {
  endDate?: string | null;
  goalName?: string;
  lagMeasure?: string;
  startDate?: string;
};

type ActiveScoreboardSectionProps = {
  activeScoreboard: ScoreboardSummary | null;
  activeScoreboardId: number | null;
  onArchive: (id: number) => void;
  pendingActionId: number | null;
};

export function ActiveScoreboardSection({
  activeScoreboard,
  activeScoreboardId,
  onArchive,
  pendingActionId,
}: ActiveScoreboardSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <div>
          <h2 className="text-sm font-bold text-text-primary">현재 활성 점수판</h2>
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
              disabled={pendingActionId !== null}
              onClick={() => {
                if (confirm("현재 활성 점수판을 보관하시겠습니까?")) {
                  onArchive(activeScoreboardId);
                }
              }}
              className="px-3 py-1.5 border border-border text-text-secondary hover:border-[rgba(205,207,213,1)] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {pendingActionId === activeScoreboardId ? (
                <InlineSpinner
                  size="sm"
                  className="border-text-secondary/20 border-t-text-secondary"
                />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
              {pendingActionId === activeScoreboardId ? "보관 중..." : "보관"}
            </Button>
          }
        />
      ) : (
        <EmptyActiveScoreboardCard />
      )}
    </section>
  );
}

function EmptyActiveScoreboardCard() {
  return (
    <Card className="border border-dashed border-border rounded-lg p-8 bg-white text-center space-y-4">
      <div className="w-12 h-12 bg-primary/10 rounded-lg  mx-auto flex items-center justify-center">
        <Zap className="text-primary w-6 h-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text-primary">
          현재 활성 점수판이 없습니다
        </p>
        <p className="text-xs text-text-muted">
          보관된 점수판을 다시 활성화하거나 새 점수판을 만들 수 있습니다.
        </p>
      </div>
      <div className="flex justify-center">
        <Button
          asChild
          className="btn-linear-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
        >
          <Link href="/setup?mode=create">
            <Plus className="w-3.5 h-3.5" />
            새 점수판 만들기
          </Link>
        </Button>
      </div>
    </Card>
  );
}
