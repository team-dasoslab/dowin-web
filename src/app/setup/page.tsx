"use client";

import { useMockData } from "@/context/MockDataContext";
import { Archive, ArrowLeft, Save, Target, Trash2, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SetupPage() {
  const {
    scoreboard,
    createScoreboard,
    updateScoreboard,
    deleteScoreboard,
    archiveScoreboard,
  } = useMockData();
  const router = useRouter();

  const [goalName, setGoalName] = useState(scoreboard?.goalName || "");
  const [lagMeasure, setLagMeasure] = useState(scoreboard?.lagMeasure || "");

  const isEditMode = !!scoreboard;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
      updateScoreboard(goalName, lagMeasure);
    } else {
      createScoreboard(goalName, lagMeasure);
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background font-pretendard py-12 px-4">
      <div className="max-w-[600px] mx-auto space-y-8 animate-linear-in">
        {/* Navigation */}
        <nav>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            돌아가기
          </Link>
        </nav>

        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Target className="w-3.5 h-3.5" />
            점수판 설정
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {isEditMode ? "현재 목표 수정하기" : "도전할 목표를 설정하세요"}
          </h1>
          <p className="text-[13px] text-text-muted leading-relaxed">
            한 번에 한 가지 목표에만 집중하는 것이 성공의 핵심입니다.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="card-linear p-8 space-y-10">
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted tracking-wide">
                <Zap className="w-4 h-4 text-primary" />
                1단계. 가중목
              </div>
              <div className="space-y-2">
                <label className="text-sm block font-bold text-text-primary ml-0.5">
                  나의 목표는 무엇인가요?
                </label>
                <input
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="예: 체중을 감량한다"
                  className="w-full text-base p-3 bg-sub-background border border-border rounded-xl focus:border-primary outline-none transition-all placeholder:text-text-muted/40"
                  required
                />
              </div>
            </div>

            <div className="space-y-5 pt-10 border-t border-border">
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted tracking-wide">
                <TrendingUp className="w-4 h-4 text-success" />
                2단계. 후행지표
              </div>
              <div className="space-y-2">
                <label className="text-sm block font-bold text-text-primary ml-0.5">
                  성공 여부를 어떻게 측정할까요?
                </label>
                <input
                  value={lagMeasure}
                  onChange={(e) => setLagMeasure(e.target.value)}
                  placeholder="예: 80kg에서 75kg까지 달성"
                  className="w-full text-sm p-3 bg-sub-background border border-border rounded-xl focus:border-primary outline-none transition-all placeholder:text-text-muted/40 font-medium"
                  required
                />
              </div>
            </div>
          </section>

          <div className="space-y-10">
            <button
              type="submit"
              className="w-full btn-linear-primary py-3.5 flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-primary/10"
            >
              <Save className="w-4 h-4" />
              <span>{isEditMode ? "설정 저장하기" : "점수판 생성하기"}</span>
            </button>

            {isEditMode && (
              <div className="space-y-6 pt-10">
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {/* Archive Section */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-text-primary">
                        가중목 보관하기
                      </div>
                      <div className="text-xs text-text-muted leading-relaxed">
                        현재 목표를 안전하게 종료하고 실행 기록으로 저장합니다.
                        <br />
                        보관 후에는 새로운 가중목을 설정할 수 있습니다.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            "이 점수판을 종료하고 보관하시겠습니까? 새로운 목표를 설정할 수 있게 됩니다.",
                          )
                        ) {
                          archiveScoreboard();
                          router.push("/");
                        }
                      }}
                      className="px-4 py-2 border border-border text-text-muted hover:text-text-primary hover:bg-sub-background rounded-lg text-xs font-bold transition-colors flex items-center gap-2 h-fit"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      보관하기
                    </button>
                  </div>

                  {/* Delete Section */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-danger/[0.02]">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-danger">
                        가중목 삭제하기
                      </div>
                      <div className="text-xs text-text-muted leading-relaxed">
                        이 점수판과 관련된 모든 기록을 영구히 삭제합니다.
                        <br />
                        삭제된 데이터는 복구할 수 없으니 신중하게 결정해 주세요.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            "정말 이 점수판을 영구 삭제하시겠습니까? 기록이 모두 사라집니다.",
                          )
                        ) {
                          deleteScoreboard();
                          router.push("/");
                        }
                      }}
                      className="px-4 py-2 bg-danger text-white rounded-lg text-xs font-bold transition-transform active:scale-95 flex items-center gap-2 h-fit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      삭제하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
