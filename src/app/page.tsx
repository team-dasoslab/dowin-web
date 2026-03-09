"use client";

import { useMockData } from "@/context/MockDataContext";
import {
  Calendar,
  Check,
  Plus,
  Settings,
  User as UserIcon,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const {
    user,
    scoreboard,
    updateLog,
    logout,
    archiveScoreboard,
    addLeadMeasure,
    updateProfile,
  } = useMockData();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Get current week dates (Mon-Sun)
  const [weekDates, setWeekDates] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
    // ... dates logic ...

    const today = new Date();
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    setWeekDates(dates);
  }, [user, router]);

  if (!user) return null;

  // Render Empty State if no scoreboard
  if (!scoreboard) {
    return (
      <div className="min-h-screen bg-background font-pretendard flex items-center justify-center p-8">
        <div className="max-w-[480px] w-full text-center space-y-8 animate-linear-in">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-10 rotate-3">
            <Zap className="text-primary w-10 h-10" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              아직 목표가 없으시네요
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              가장 중요한 단 하나의 목표, 가중목을 설정하고
              <br />
              매일의 성장을 기록하기 시작하세요.
            </p>
          </div>
          <div className="pt-8">
            <Link
              href="/setup"
              className="btn-linear-primary w-full py-4 flex items-center justify-center gap-2 text-base shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              <span>새 점수판 만들기</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[1000px] mx-auto p-4 md:p-8 space-y-10 animate-linear-in">
        {/* Header */}
        <header className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {user.nickname}님의 점수판
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="px-4 py-2 bg-white border border-border rounded-xl text-xs font-bold text-text-primary hover:border-primary/30 hover:shadow-sm transition-all flex items-center gap-2 group shadow-sm active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors" />
              <span>내 프로필</span>
            </Link>
          </div>
        </header>

        {/* Compact WIG Section */}
        <section className="card-linear px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.1em]">
              <Zap className="w-3.5 h-3.5" />
              가중목
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight leading-none">
              {scoreboard.goalName}
            </h2>
          </div>

          <div className="flex-1 md:border-l md:border-border md:pl-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-[0.1em]">
                후행지표
              </div>
              <div className="text-base font-bold text-text-primary font-inter">
                {scoreboard.lagMeasure}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/setup"
                className="p-2 bg-sub-background border border-border rounded-lg text-text-muted hover:text-primary transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Lead Measures Table */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-muted" />
              주간 선행지표
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-text-muted bg-sub-background px-2 py-1 rounded border border-border">
                {weekDates[0]} ~ {weekDates[6]}
              </span>
              <Link
                href="/add-lead-measure"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                지표 추가
              </Link>
            </div>
          </div>

          <div className="card-linear overflow-hidden border-border transition-none">
            <table className="w-full text-left border-collapse table-fixed">
              <colgroup>
                <col className="w-auto" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="bg-sub-background border-b border-border">
                  <th className="py-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                    선행지표 항목
                  </th>
                  {["월", "화", "수", "목", "금", "토", "일"].map((day, i) => (
                    <th
                      key={i}
                      className="py-4 px-1 text-center text-[11px] font-bold text-text-muted uppercase tracking-widest"
                    >
                      {day}
                    </th>
                  ))}
                  <th className="py-4 px-6 text-center text-[11px] font-bold text-text-muted uppercase tracking-widest">
                    달성률
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scoreboard.leadMeasures
                  .filter((lm) => lm.status === "ACTIVE")
                  .map((lm) => {
                    const achievedCount = weekDates.filter(
                      (date) => lm.logs.find((l) => l.logDate === date)?.value,
                    ).length;
                    const rate = Math.round(
                      (achievedCount / lm.targetValue) * 100,
                    );

                    return (
                      <tr key={lm.id} className="bg-white">
                        <td className="py-5 px-6">
                          <div className="flex flex-col gap-0.5">
                            <Link
                              href={`/measure/${lm.id}`}
                              className="text-sm font-bold text-text-primary truncate hover:text-primary transition-colors inline-block"
                            >
                              {lm.name}
                            </Link>
                            <span className="text-[11px] text-text-muted">
                              목표: 주 {lm.targetValue}회
                            </span>
                          </div>
                        </td>
                        {weekDates.map((date) => {
                          const log = lm.logs.find((l) => l.logDate === date);
                          const isAchieved = log?.value;

                          return (
                            <td key={date} className="py-4 px-1 text-center">
                              <button
                                onClick={() =>
                                  updateLog(lm.id, date, !isAchieved)
                                }
                                className={`
                                w-8 h-8 mx-auto rounded-md flex items-center justify-center transition-all duration-200
                                ${
                                  isAchieved
                                    ? "bg-primary text-white scale-100"
                                    : "bg-sub-background text-text-muted/30 border border-border select-none active:bg-primary/5"
                                }
                              `}
                              >
                                {isAchieved ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <span className="text-[10px] font-bold">
                                    X
                                  </span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td className="py-5 px-6 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-sub-background rounded-full overflow-hidden border border-border">
                              <div
                                className={`h-full transition-all duration-500 ${rate >= 100 ? "bg-accent" : "bg-primary"}`}
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              />
                            </div>
                            <span
                              className={`text-[10px] font-bold font-inter ${rate >= 100 ? "text-accent" : "text-text-primary"}`}
                            >
                              {rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
