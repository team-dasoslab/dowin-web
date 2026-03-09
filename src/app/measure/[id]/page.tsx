"use client";

import { useMockData } from "@/context/MockDataContext";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function MeasureDetailPage() {
  const { id } = useParams();
  const { user, scoreboard, archiveLeadMeasure, deleteLeadMeasure } =
    useMockData();
  const router = useRouter();

  const measure = useMemo(() => {
    return scoreboard?.leadMeasures.find((lm) => lm.id === id);
  }, [scoreboard, id]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user || !measure) return null;

  // Mock Trend Data for Chart
  const chartData = [
    { name: "4주 전", rate: 60 },
    { name: "3주 전", rate: 85 },
    { name: "2주 전", rate: 45 },
    { name: "지난 주", rate: 90 },
    {
      name: "이번 주",
      rate: Math.round(
        (measure.logs.filter((l) => l.value).length / measure.targetValue) *
          100,
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[1000px] mx-auto p-8 space-y-8 animate-linear-in">
        {/* Navigation */}
        <nav>
          <Link
            href="/dashboard/my"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            대시보드로 돌아가기
          </Link>
        </nav>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
              <Target className="w-3.5 h-3.5" />
              선행지표 상세
            </div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              {measure.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                목표: 주 {measure.targetValue}회
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>
                상태: {measure.status === "ACTIVE" ? "진행 중" : "보관됨"}
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            <section className="card-linear p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  주간 달성 트렌드
                </h3>
              </div>

              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorRate"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="rgba(94, 106, 210, 0.3)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="rgba(94, 106, 210, 0)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(226, 228, 233, 0.5)"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "rgba(156, 163, 175, 1)",
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                      dy={10}
                    />
                    <YAxis hide={true} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 1)",
                        border: "1px solid rgba(226, 228, 233, 1)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="rgba(94, 106, 210, 1)"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRate)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* History Table (Simulated) */}
            <section className="card-linear overflow-hidden">
              <div className="px-6 py-4 bg-sub-background border-b border-border flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  전체 기록 히스토리
                </h3>
              </div>
              <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="px-6 py-4 flex items-center justify-between hover:bg-sub-background/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${i % 3 === 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}
                      >
                        {i % 3 === 0 ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-primary">
                          2024.03.0{i}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {i % 3 === 0 ? "미달성" : "목표 달성 완료"}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] font-medium text-text-muted">
                      {10 - i}시간 전
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar / Info */}
          <div className="space-y-6">
            <section className="card-linear p-6 space-y-4">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">
                지표 정의 및 안내
              </h3>
              <p className="text-sm text-text-primary leading-relaxed">
                선행지표는 결과에 직접적인 영향을 주는 요소입니다.
                <strong>{measure.name}</strong> 항목의 꾸준한 실천이 후행지표
                달성으로 이어집니다.
              </p>
              <div className="pt-4 border-t border-border mt-4">
                <div className="text-xs font-bold text-text-muted mb-2">
                  설명
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  매일 오전 10시 이전에 이행 여부를 기록하는 것이 가장
                  효과적입니다.
                </p>
              </div>
            </section>

            <button className="w-full btn-linear-primary py-3 text-sm">
              지표 설정 수정
            </button>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (
                    confirm(
                      "정말 이 지표를 보관하시겠습니까? 활성 점수판에서 제외됩니다.",
                    )
                  ) {
                    archiveLeadMeasure(measure.id);
                    router.push("/");
                  }
                }}
                className="w-full py-2.5 text-xs font-bold text-text-muted border border-border rounded-md hover:bg-sub-background transition-colors"
              >
                지표 보관하기
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "정말 삭제하시겠습니까? 모든 과거 기록이 영구적으로 삭제됩니다.",
                    )
                  ) {
                    deleteLeadMeasure(measure.id);
                    router.push("/");
                  }
                }}
                className="w-full py-2.5 text-xs font-bold text-danger border border-danger/10 rounded-md hover:bg-danger/5 transition-colors"
              >
                지표 삭제하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
