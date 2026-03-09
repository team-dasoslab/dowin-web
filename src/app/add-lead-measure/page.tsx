"use client";

import { useMockData } from "@/context/MockDataContext";
import { ArrowLeft, Save, Target, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddLeadMeasurePage() {
  const { scoreboard, addLeadMeasure } = useMockData();
  const router = useRouter();

  const [name, setName] = useState("");
  const [targetValue, setTargetValue] = useState(7);
  const [period, setPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addLeadMeasure(name, targetValue, period);
    router.push("/");
  };

  if (!scoreboard) return null;

  return (
    <div className="min-h-screen bg-background font-pretendard py-12 px-4">
      <div className="max-w-[600px] mx-auto space-y-8 animate-linear-in">
        <nav>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            돌아가기
          </Link>
        </nav>

        {/* WIG Context Re-reminder */}
        <div className="card-linear p-5 border-primary/20 bg-primary/[0.02] flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest">
              현재 가중목
            </div>
            <div className="text-sm font-bold text-text-primary">
              {scoreboard.goalName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-text-muted">
              후행지표
            </div>
            <div className="text-[11px] font-bold text-text-primary/70">
              {scoreboard.lagMeasure}
            </div>
          </div>
        </div>

        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Zap className="w-3.5 h-3.5" />
            선행지표 설계
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            새로운 행동 지표 추가하기
          </h1>
          <p className="text-[13px] text-text-muted leading-relaxed">
            목표를 달성하기 위해 매일 또는 매주 반복할 수 있는 '행동'을
            정의하세요.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="card-linear p-8 space-y-10">
            {/* 4DX Powered Name Input */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm block font-bold text-text-primary ml-0.5">
                  어떤 행동을 반복할까요?
                </label>
                <div className="group relative">
                  <div className="cursor-help flex items-center gap-1.5 text-[10px] bg-sub-background px-2 py-1 rounded-md text-text-muted font-bold transition-colors hover:text-primary hover:bg-primary/5">
                    <Target className="w-3 h-3" />
                    4DX 지표 가이드
                  </div>
                  {/* Tooltip */}
                  <div className="absolute right-0 bottom-full mb-2 w-64 p-4 bg-white border border-border rounded-xl shadow-xl shadow-black/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <div className="text-xs font-bold text-text-primary mb-2">
                      좋은 선행지표의 요건
                    </div>
                    <ul className="space-y-2">
                      <li className="flex gap-2 text-[11px] text-text-muted leading-relaxed">
                        <span className="text-primary font-bold">1.</span>
                        <div>
                          <b className="text-text-primary">예측성:</b>{" "}
                          후행지표가 정말 바뀔까요?
                        </div>
                      </li>
                      <li className="flex gap-2 text-[11px] text-text-muted leading-relaxed">
                        <span className="text-primary font-bold">2.</span>
                        <div>
                          <b className="text-text-primary">통제 가능성:</b> 내가
                          직접 할 수 있는 일인가요?
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 매일 물 2L 마시기, 주 3회 30분 달리기"
                className="w-full text-base p-4 bg-sub-background border border-border rounded-2xl focus:border-primary outline-none transition-all placeholder:text-text-muted/30"
                required
                autoFocus
              />
            </div>

            {/* Period Selection */}
            <div className="space-y-4">
              <label className="text-sm block font-bold text-text-primary ml-0.5">
                반복 주기
              </label>
              <div className="flex p-1 bg-sub-background rounded-2xl border border-border gap-1">
                {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPeriod(p);
                      if (p === "DAILY") setTargetValue(3);
                      if (p === "WEEKLY") setTargetValue(1);
                      if (p === "MONTHLY") setTargetValue(12);
                    }}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                      period === p
                        ? "bg-white text-primary shadow-sm ring-1 ring-border/50"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {p === "DAILY" ? "매일" : p === "WEEKLY" ? "매주" : "매월"}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Setting */}
            <div className="space-y-4">
              <label className="text-sm block font-bold text-text-primary ml-0.5">
                {period === "DAILY"
                  ? "한 주"
                  : period === "WEEKLY"
                    ? "이번 달"
                    : "일 년"}
                에 몇 번 실행할까요?
              </label>
              <div className="flex items-center gap-6 bg-sub-background/50 p-4 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={period === "DAILY" ? 7 : period === "WEEKLY" ? 5 : 365}
                    value={targetValue}
                    onChange={(e) =>
                      setTargetValue(parseInt(e.target.value) || 1)
                    }
                    className="w-16 text-center text-xl p-2 bg-white border border-border rounded-xl focus:border-primary outline-none transition-all font-bold shadow-sm"
                  />
                  <span className="text-sm font-bold text-text-primary">
                    회 실행
                  </span>
                </div>
                <div className="h-4 w-px bg-border mx-2" />
                <p className="text-[11px] text-text-muted font-medium leading-relaxed">
                  {period === "DAILY"
                    ? "일주일 중 목표 횟수를 정합니다."
                    : period === "WEEKLY"
                      ? "한 달 중 실행 주간 수를 정합니다."
                      : "지정된 기간 내 총 목표 횟수입니다."}
                </p>
              </div>
            </div>
          </section>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full btn-linear-primary py-4 flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-primary/10 transition-all hover:translate-y-[-1px] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>선행지표 저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
