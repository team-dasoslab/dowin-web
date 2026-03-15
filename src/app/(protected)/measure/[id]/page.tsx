"use client";

import { useScoreboardMeasureDetail } from "@/app/measure/[id]/_hooks/useScoreboardMeasureDetail";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  PencilLine,
  Target,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const statusLabel = {
  ACTIVE: "진행 중",
  ARCHIVED: "보관됨",
} as const;

export default function MeasureDetailPage() {
  const params = useParams<{ id: string }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const {
    archive,
    chartData,
    hasActiveScoreboard,
    isArchiving,
    isDeleting,
    isLoading,
    leadMeasuresError,
    measure,
    remove,
    weeklyLogsError,
    weeklyMeasure,
  } = useScoreboardMeasureDetail(rawId ?? "");

  if (!hasActiveScoreboard) {
    return (
      <div className="min-h-screen bg-background font-pretendard">
        <div className="max-w-[720px] mx-auto p-4 md:p-8">
          <Card className="card-linear p-8 text-center space-y-4">
            <h1 className="text-xl font-bold text-text-primary">
              활성 점수판이 없습니다
            </h1>
            <p className="text-sm text-text-secondary">
              선행지표 상세를 보려면 먼저 점수판을 만들어야 합니다.
            </p>
            <Button asChild className="btn-linear-primary px-4 py-2 text-sm">
              <Link href="/setup">점수판 설정으로 이동</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-pretendard">
        <div className="max-w-[1000px] mx-auto p-4 md:p-8 space-y-6 animate-pulse">
          <div className="h-6 w-40 rounded bg-sub-background" />
          <div className="h-36 rounded-2xl bg-sub-background" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-80 rounded-2xl bg-sub-background" />
            <div className="h-80 rounded-2xl bg-sub-background" />
          </div>
        </div>
      </div>
    );
  }

  if (!measure || !weeklyMeasure) {
    const hasError = leadMeasuresError || weeklyLogsError;

    return (
      <div className="min-h-screen bg-background font-pretendard">
        <div className="max-w-[720px] mx-auto p-4 md:p-8">
          <Card className="card-linear p-8 text-center space-y-4">
            <h1 className="text-xl font-bold text-text-primary">
              선행지표를 찾을 수 없습니다
            </h1>
            <p className="text-sm text-text-secondary">
              {hasError
                ? "데이터를 불러오는 중 문제가 발생했습니다."
                : "보관되었거나 현재 점수판에 없는 지표일 수 있습니다."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild className="px-4 py-2 text-sm border border-border">
                <Link href="/dashboard/my">대시보드로 돌아가기</Link>
              </Button>
              <Button asChild className="btn-linear-primary px-4 py-2 text-sm">
                <Link href="/setup">설정으로 이동</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const achieved = weeklyMeasure.achieved ?? 0;
  const targetValue = measure.targetValue ?? 0;
  const achievementRate = weeklyMeasure.achievementRate ?? 0;
  const successfulDays = chartData.filter((item) => item.value === true).length;
  const failedDays = chartData.filter((item) => item.value === false).length;
  const pendingDays = chartData.filter((item) => item.value === null).length;

  const handleArchive = async () => {
    if (
      !confirm("정말 이 지표를 보관하시겠습니까? 활성 점수판 집계에서 제외됩니다.")
    ) {
      return;
    }

    const success = await archive();
    if (success) {
      router.push("/setup");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm("정말 삭제하시겠습니까? 이 지표의 모든 과거 기록이 영구적으로 삭제됩니다.")
    ) {
      return;
    }

    const success = await remove();
    if (success) {
      router.push("/setup");
    }
  };

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[1000px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        <nav>
          <Button
            asChild
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors group"
          >
            <Link href="/dashboard/my">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              대시보드로 돌아가기
            </Link>
          </Button>
        </nav>

        <header className="flex flex-col gap-6 rounded-2xl border border-border bg-white px-6 py-7 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
              <Target className="w-3.5 h-3.5" />
              선행지표 상세
            </div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              {measure.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                목표: 주 {targetValue}회
              </span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>상태: {statusLabel[measure.status ?? "ACTIVE"]}</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>{achievementRate}% 달성</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:min-w-[280px]">
            <Card className="border border-border px-4 py-3 text-center">
              <p className="text-[11px] text-text-muted">달성</p>
              <p className="mt-1 text-lg font-bold text-success">{achieved}</p>
            </Card>
            <Card className="border border-border px-4 py-3 text-center">
              <p className="text-[11px] text-text-muted">목표</p>
              <p className="mt-1 text-lg font-bold text-text-primary">
                {targetValue}
              </p>
            </Card>
            <Card className="border border-border px-4 py-3 text-center">
              <p className="text-[11px] text-text-muted">미기록</p>
              <p className="mt-1 text-lg font-bold text-amber-600">
                {pendingDays}
              </p>
            </Card>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="card-linear p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  이번 주 기록 추이
                </h2>
                <p className="text-xs text-text-muted">
                  기록됨 {successfulDays + failedDays}일
                </p>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="measure-rate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgba(94, 106, 210, 0.32)" />
                        <stop offset="95%" stopColor="rgba(94, 106, 210, 0)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(226, 228, 233, 0.5)"
                    />
                    <XAxis
                      dataKey="dayLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "rgba(156, 163, 175, 1)",
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 50, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "rgba(156, 163, 175, 1)",
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value ?? 0}%`, "달성 여부"]}
                      labelFormatter={(label) => `${label}요일`}
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
                      dataKey={(entry) =>
                        entry.value === true ? 100 : entry.value === false ? 0 : 50
                      }
                      stroke="rgba(94, 106, 210, 1)"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#measure-rate)"
                      animationDuration={500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="card-linear overflow-hidden">
              <div className="px-6 py-4 bg-sub-background border-b border-border flex items-center justify-between">
                <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  이번 주 일자별 기록
                </h2>
                <p className="text-[11px] text-text-muted">
                  달성 {achieved}/{targetValue}
                </p>
              </div>
              <div className="divide-y divide-border">
                {chartData.map((item) => {
                  const state =
                    item.value === true
                      ? {
                          icon: <CheckCircle2 className="w-4 h-4" />,
                          badge: "달성",
                          tone: "bg-success/10 text-success",
                        }
                      : item.value === false
                        ? {
                            icon: <XCircle className="w-4 h-4" />,
                            badge: "미달성",
                            tone: "bg-danger/10 text-danger",
                          }
                        : {
                            icon: <Clock3 className="w-4 h-4" />,
                            badge: "미기록",
                            tone: "bg-amber-500/10 text-amber-700",
                          };

                  return (
                    <div
                      key={item.date}
                      className="px-6 py-4 flex items-center justify-between hover:bg-sub-background/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${state.tone}`}
                        >
                          {state.icon}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-text-primary">
                            {item.date}
                          </div>
                          <div className="text-[11px] text-text-muted">
                            {item.dayLabel}요일
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] font-semibold text-text-secondary">
                        {state.badge}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="card-linear p-6 space-y-4">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">
                지표 해석
              </h2>
              <p className="text-sm text-text-primary leading-relaxed">
                <strong>{measure.name}</strong>의 이번 주 진행률은{" "}
                <strong>{achievementRate}%</strong>입니다. 현재까지 {successfulDays}
                일 달성했고, {failedDays}일은 미달성, {pendingDays}일은 아직
                기록되지 않았습니다.
              </p>
              <div className="pt-4 border-t border-border space-y-2 text-xs text-text-secondary">
                <p>좋은 선행지표는 직접 통제 가능한 행동이어야 합니다.</p>
                <p>미기록 일자가 많다면 매일 같은 시간에 체크하는 루틴을 권장합니다.</p>
              </div>
            </Card>

            <Button asChild className="w-full btn-linear-primary py-3 text-sm">
              <Link href="/setup">
                <PencilLine className="w-4 h-4" />
                점수판 설정 수정
              </Link>
            </Button>

            <div className="space-y-3">
              <Button
                onClick={handleArchive}
                disabled={isArchiving || isDeleting}
                className="w-full py-2.5 text-xs font-bold text-text-muted border border-border rounded-md hover:bg-sub-background transition-colors"
              >
                지표 보관하기
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isArchiving || isDeleting}
                className="w-full py-2.5 text-xs font-bold text-danger border border-danger/10 rounded-md hover:bg-danger/5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                지표 삭제하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
