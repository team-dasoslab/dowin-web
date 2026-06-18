"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { AlertCircle, ArrowRight, Bot, HelpCircle, CheckCircle2, Clock } from "lucide-react";

const MOCK_SIGNALS = [
  {
    id: 1,
    name: "김민수",
    actionItem: "B2B 콜드메일 초안 작성",
    signalType: "blocked",
    message: "막힘 있음",
    time: "2시간 전",
  },
  {
    id: 2,
    name: "이지은",
    actionItem: "1분기 회고 문서 초안",
    signalType: "adjust",
    message: "목표 조정 필요",
    time: "4시간 전",
  },
];

const MOCK_ACTIVITY = [
  {
    id: 1,
    type: "sent",
    message: "박지호님에게 '온보딩 개선안' 체크인 발송",
    time: "10분 전",
    icon: <Bot className="w-4 h-4 text-primary" />,
  },
  {
    id: 2,
    type: "response_now",
    message: "박지호님이 '지금 기록하기' 선택 후 기록 완료",
    time: "8분 전",
    icon: <CheckCircle2 className="w-4 h-4 text-success" />,
  },
  {
    id: 3,
    type: "response_later",
    message: "최수영님이 '오늘 나중에 하기' 선택 (당일 재발송 방지됨)",
    time: "1시간 전",
    icon: <Clock className="w-4 h-4 text-text-muted" />,
  },
];

export function LeaderReport() {
  return (
    <div className="space-y-8 animate-dowin-in">
      {/* Header section */}
      <div className="bg-surface/50 p-6 rounded-3xl border border-border/50 backdrop-blur-sm">
        <h2 className="text-2xl font-extrabold text-text-primary mb-2">체크인 결과 리포트</h2>
        <p className="text-base text-text-secondary">
          이번 주 Dowin이 반복 확인을 대신 처리했습니다. 리더님은 직접 개입이 필요한 항목만 챙겨주세요.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="총 체크인 발송 수"
          value="12건"
          description="대상 팀원 5명"
          className="bg-primary/5 border-primary/20 shadow-sm transition-transform"
          valueClassName="text-primary text-2xl"
        />
        <StatCard
          label="1탭 반응률"
          value="83%"
          description="10명 응답"
          className="bg-surface shadow-sm border-border/50 transition-transform"
          valueClassName="text-2xl"
        />
        <StatCard
          label="기록 재개율 (24h)"
          value="66%"
          description="8명 기록 완료"
          className="bg-surface shadow-sm border-border/50 transition-transform"
          valueClassName="text-2xl"
        />
        <StatCard
          label="조정 필요 신호"
          value="2건"
          description="리더 확인 필요"
          className="bg-danger/5 border-danger/20 shadow-sm transition-transform"
          valueClassName="text-danger text-2xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attention Needed (Signals) */}
        <Card className="p-6 glass shadow-xl shadow-danger/5 border-border/50 flex flex-col h-full rounded-3xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse"></span>
              리더 확인 필요 신호
            </h3>
            <Badge className="bg-danger/10 text-danger text-xs px-2.5 py-1 rounded-full font-bold">
              2건
            </Badge>
          </div>
          <p className="text-sm text-text-secondary mb-5">
            반복 푸시보다 목표와 액션 아이템 조정이 필요한 신호가 있습니다.
          </p>

          <div className="space-y-4 flex-1">
            {MOCK_SIGNALS.map((signal) => (
              <div
                key={signal.id}
                className="p-4 rounded-2xl border border-border/50 bg-surface/80 transition-all flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-text-primary">
                      {signal.name}
                    </span>
                    <span className="text-xs text-text-muted bg-sub-background px-2 py-0.5 rounded-full">{signal.time}</span>
                  </div>
                  <Badge
                    className={`text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 border ${
                      signal.signalType === "blocked"
                        ? "bg-danger/5 text-danger border-danger/20"
                        : "bg-accent/5 text-accent border-accent/20"
                    }`}
                  >
                    {signal.signalType === "blocked" ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : (
                      <HelpCircle className="w-3.5 h-3.5" />
                    )}
                    {signal.message}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary">
                  {signal.actionItem}
                </p>
                <button className="text-sm text-primary font-bold flex items-center gap-1 mt-1 w-fit transition-transform">
                  대화 열기 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity Log */}
        <Card className="p-6 glass shadow-xl shadow-primary/5 border-border/50 flex flex-col h-full rounded-3xl">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            최근 체크인 활동
          </h3>
          
          <div className="space-y-6 flex-1 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border/50 before:to-transparent">
            {MOCK_ACTIVITY.map((activity) => (
              <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-surface bg-sub-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 transition-transform">
                  {activity.icon}
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl border border-border/50 bg-surface/80 shadow-sm transition-all">
                  <p className="text-sm text-text-primary leading-snug font-medium">{activity.message}</p>
                  <p className="text-xs text-text-muted mt-1.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
