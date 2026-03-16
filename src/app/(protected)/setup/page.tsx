"use client";

import { useScoreboardSetup } from "@/app/(protected)/setup/_hooks/useScoreboardSetup";
import { InlineSpinner } from "@/components/InlineSpinner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Activity,
  Archive,
  ArrowLeft,
  Plus,
  Save,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
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

  if (isInitializing) {
    return <LoadingSpinner message="점수판 정보를 불러오는 중입니다." />;
  }

  const isMutating = isSubmitPending || isArchivePending;

  return (
    <div className="min-h-screen bg-background font-pretendard">
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
            <Button
              asChild
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors"
            >
              <Link href="/dashboard/my">
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </Button>
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
            하나의 목표(WIG) · 성공 척도(후행지표) · 핵심 행동(선행지표)을 설정하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── 가중목 ── */}
          <Card className="border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 bg-sub-background border-b border-border flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-text-primary">
                가중목
              </span>
            </div>
            <div className="p-5 space-y-3">
              <label className="text-xs font-bold text-text-secondary block">
                가장 중요한 목표는 무엇인가요?
              </label>
              <Input
                value={goalName}
                disabled={isMutating}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="예: 연말까지 영업이익 20% 증대"
                className="w-full text-sm p-3 bg-sub-background border border-border rounded-lg focus:border-primary outline-none transition-colors placeholder:text-text-muted/40"
                required
              />
            </div>
          </Card>

          {/* ── 후행지표 ── */}
          <Card className="border border-border rounded-lg">
            <div className="px-5 py-3 bg-sub-background border-b rounded-t-lg border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs font-bold text-text-primary">
                  후행지표
                </span>
              </div>
              {/* 툴팁 */}
              <div className="relative">
                <Button
                  type="button"
                  disabled={isMutating}
                  onClick={() =>
                    setActiveTooltip(activeTooltip === "lag" ? null : "lag")
                  }
                  className="text-[10px] text-text-muted hover:text-primary transition-colors font-medium flex items-center gap-0.5"
                >
                  지표 가이드 ›
                </Button>
                {activeTooltip === "lag" && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setActiveTooltip(null)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 p-4 bg-white border border-border rounded-lg shadow-lg transition-all z-20">
                      <p className="text-[10px] font-bold text-text-primary mb-2 uppercase tracking-wider">
                        좋은 후행지표
                      </p>
                      <ul className="space-y-2 text-[11px] text-text-secondary leading-relaxed">
                        <li>
                          <b className="text-text-primary">측정 가능:</b>{" "}
                          시작점(X)과 목표점(Y)이 명확한가요?
                        </li>
                        <li>
                          <b className="text-text-primary">결과 중심:</b> 최종
                          목표 달성 여부를 나타내나요?
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="p-5 space-y-3">
              <label className="text-xs font-bold text-text-secondary block">
                성공을 어떻게 측정할 건가요? (X → Y)
              </label>
              <Input
                value={lagMeasure}
                disabled={isMutating}
                onChange={(e) => setLagMeasure(e.target.value)}
                placeholder="예: 1,000만 원에서 1,200만 원으로"
                className="w-full text-sm p-3 bg-sub-background border border-border rounded-lg focus:border-primary outline-none transition-colors placeholder:text-text-muted/40"
                required
              />
            </div>
          </Card>

          {/* ── 선행지표 ── */}
          <Card className="border border-border rounded-lg">
            <div className="px-5 py-3 bg-sub-background border-b rounded-t-lg border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs font-bold text-text-primary">
                  선행지표
                </span>
                <span className="text-[10px] text-text-muted">
                  — 후행지표에 직접적 영향을 주는 핵심 행동
                </span>
              </div>
              {/* 툴팁 */}
              <div className="relative">
                <Button
                  type="button"
                  disabled={isMutating}
                  onClick={() =>
                    setActiveTooltip(activeTooltip === "lead" ? null : "lead")
                  }
                  className="text-[10px] text-text-muted hover:text-primary transition-colors font-medium flex items-center gap-0.5"
                >
                  4DX 가이드 ›
                </Button>
                {activeTooltip === "lead" && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setActiveTooltip(null)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 p-4 bg-white border border-border rounded-lg shadow-lg transition-all z-20">
                      <p className="text-[10px] font-bold text-text-primary mb-2 uppercase tracking-wider">
                        좋은 선행지표
                      </p>
                      <ul className="space-y-2 text-[11px] text-text-secondary leading-relaxed">
                        <li>
                          <b className="text-text-primary">예측성:</b> 이 행동이
                          후행지표를 움직이나요?
                        </li>
                        <li>
                          <b className="text-text-primary">통제 가능:</b> 직접
                          실행하고 반복할 수 있나요?
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="divide-y divide-border">
              {measures.map((measure, index) => (
                <div key={measure.id} className="p-5 space-y-4">
                  {/* 행동명 */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-secondary">
                      핵심 행동 #{index + 1}
                    </label>
                    {measures.length > 1 && (
                      <Button
                        type="button"
                        disabled={isMutating}
                        onClick={() => removeMeasureRow(measure.id)}
                        className="text-[11px] text-danger font-bold hover:bg-danger/5 px-2 py-0.5 rounded transition-colors"
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                  <Input
                    value={measure.name}
                    disabled={isMutating}
                    onChange={(e) =>
                      handleMeasureChange(measure.id, "name", e.target.value)
                    }
                    placeholder="예: 주 5회 핵심 고객에게 연락"
                    className="w-full text-sm p-3 bg-sub-background border border-border rounded-lg focus:border-primary outline-none transition-colors placeholder:text-text-muted/40"
                    required
                  />

                  {/* 주기 + 횟수 */}
                  <div className="flex items-center gap-3">
                    {/* 주기 토글 */}
                    <div className="flex p-0.5 bg-sub-background border border-border rounded-lg gap-0.5 flex-shrink-0">
                      {(["WEEKLY", "MONTHLY"] as const).map((p) => (
                        <Button
                          key={p}
                          type="button"
                          disabled={isMutating}
                          onClick={() => {
                            handleMeasureChange(measure.id, "period", p);
                            handleMeasureChange(
                              measure.id,
                              "targetValue",
                              p === "WEEKLY" ? 3 : 1,
                            );
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                            measure.period === p
                              ? "bg-white text-primary border border-border shadow-sm"
                              : "text-text-muted hover:text-text-primary"
                          }`}
                        >
                          {p === "WEEKLY" ? "주 단위" : "월 단위"}
                        </Button>
                      ))}
                    </div>

                    {/* 목표 횟수 */}
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max={measure.period === "WEEKLY" ? 7 : 31}
                        value={measure.targetValue}
                        disabled={isMutating}
                        onChange={(e) =>
                          handleMeasureChange(
                            measure.id,
                            "targetValue",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="w-14 text-center text-sm p-2 bg-white border border-border rounded-lg focus:border-primary outline-none transition-colors font-bold"
                      />
                      <span className="text-xs text-text-secondary font-medium whitespace-nowrap">
                        회 / {measure.period === "WEEKLY" ? "주" : "월"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 핵심 행동 추가 버튼 */}
            <div className="px-5 py-3 border-t border-dashed border-border">
              <Button
                type="button"
                disabled={isMutating}
                onClick={addMeasureRow}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-text-muted hover:text-primary transition-colors py-1"
              >
                <Plus className="w-3.5 h-3.5" />
                핵심 행동 추가
              </Button>
            </div>
          </Card>

          {/* ── 저장 버튼 ── */}
          <Button
            type="submit"
            disabled={isMutating}
            className={`w-full py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-lg transition-all ${
              isMutating
                ? "bg-primary/50 text-white cursor-not-allowed"
                : "btn-linear-primary"
            }`}
          >
            {isSubmitPending ? (
              <InlineSpinner />
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                {isEditMode ? "변경사항 저장" : "점수판 생성"}
              </>
            )}
          </Button>

          {/* ── 관리 영역 (수정 모드에서만) ── */}
          {isEditMode && (
            <div className="space-y-2 pt-4">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-0.5">
                관리
              </p>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between bg-white">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      점수판 보관
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      현재 목표를 종료하고 실행 기록으로 저장합니다.
                    </p>
                  </div>
                  <Button
                    type="button"
                    disabled={isMutating}
                    onClick={() => {
                      if (confirm("이 점수판을 보관하시겠습니까?")) {
                        void archive();
                      }
                    }}
                    className="flex-shrink-0 px-3 py-1.5 border border-border text-text-secondary hover:border-[rgba(205,207,213,1)] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ml-4"
                  >
                    {isArchivePending ? (
                      <InlineSpinner size="sm" className="border-text-secondary/20 border-t-text-secondary" />
                    ) : (
                      <Archive className="w-3.5 h-3.5" />
                    )}
                    {isArchivePending ? "보관 중..." : "보관"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
