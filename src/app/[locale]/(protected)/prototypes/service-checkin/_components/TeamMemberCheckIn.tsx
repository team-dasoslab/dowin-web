"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Clock, AlertCircle, HelpCircle, Sparkles } from "lucide-react";

interface TeamMemberCheckInProps {
  actionItemName?: string;
}

export function TeamMemberCheckIn({
  actionItemName = "B2B 콜드메일 초안 작성",
}: TeamMemberCheckInProps) {
  const [response, setResponse] = useState<string | null>(null);

  if (response) {
    return (
      <Card className="p-8 glass animate-dowin-in flex flex-col items-center justify-center min-h-[300px] text-center space-y-4 shadow-lg border-border/50 rounded-3xl">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">응답이 전달되었습니다</h3>
        <p className="text-base text-text-secondary">
          {response === "now" && "멋진 실행입니다! 지금 바로 기록 화면으로 이동합니다."}
          {response === "later" && "알겠습니다. 오늘 나중에 다시 알려드릴게요."}
          {response === "blocked" && "리더에게 막힘 상태를 전달했습니다. 곧 도움을 받을 수 있을 거예요."}
          {response === "adjust" && "리더에게 목표 조정 필요 상태를 전달했습니다."}
        </p>
        <Button 
          className="mt-6 px-6 py-2.5 bg-sub-background text-text-secondary transition-colors rounded-full font-medium"
          onClick={() => setResponse(null)}
        >
          초기화 (프로토타입)
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-8 glass shadow-xl shadow-primary/5 border-border/50 rounded-3xl flex flex-col space-y-8 animate-dowin-in">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold tracking-wide text-primary">
            Dowin Check-in
          </span>
        </div>
        <h3 className="text-2xl font-extrabold text-text-primary leading-tight tracking-tight">
          이번 주 <span className="text-primary bg-primary/5 px-2 py-0.5 rounded-lg">[{actionItemName}]</span> 기록이<br/>아직 없어요.
        </h3>
        <p className="text-base text-text-secondary">
          오늘 가능한 가장 작은 실행을 하나만 업데이트해 주세요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Primary Action */}
        <Button
          onClick={() => setResponse("now")}
          className="w-full h-14 btn-dowin-primary text-base flex items-center justify-center gap-2 transition-all duration-200"
        >
          <CheckCircle2 className="w-5 h-5" />
          지금 기록하기
        </Button>

        {/* Secondary Action */}
        <Button
          onClick={() => setResponse("later")}
          className="w-full h-12 bg-sub-background text-text-primary font-bold rounded-button flex items-center justify-center gap-2 transition-colors"
        >
          <Clock className="w-4 h-4 text-text-muted" />
          오늘 나중에 하기
        </Button>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {/* Ghost Actions */}
          <Button
            onClick={() => setResponse("blocked")}
            className="h-11 bg-transparent border border-border/60 text-text-secondary rounded-button text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-danger/70" />
            막힘 있음
          </Button>
          <Button
            onClick={() => setResponse("adjust")}
            className="h-11 bg-transparent border border-border/60 text-text-secondary rounded-button text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-accent" />
            목표 조정 필요
          </Button>
        </div>
      </div>
    </Card>
  );
}
