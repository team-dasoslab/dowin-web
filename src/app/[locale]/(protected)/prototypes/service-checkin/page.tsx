import React from "react";
import { TeamMemberCheckIn } from "./_components/TeamMemberCheckIn";
import { LeaderReport } from "./_components/LeaderReport";
export default function ServiceCheckInPrototypePage() {
  return (
    <div className="min-h-screen bg-dowin-surface-gradient bg-dowin-grid-pattern py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-16 animate-dowin-in">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-2 border border-primary/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            New Feature Prototype
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight">
            Service-led Team Check-in
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Dowin이 리더의 개입 없이 팀원의 실행을 똑똑하게 독려합니다.<br className="hidden md:block"/>
            리더는 팀의 상태를 파악하고, 꼭 필요한 순간에만 개입하여 효율적인 매니지먼트를 실현하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left Column: Team Member Experience */}
          <div className="lg:col-span-5 space-y-8 sticky top-8">
            <div className="flex flex-col items-center text-center space-y-2">
              <h2 className="text-2xl font-bold text-text-primary">1. 팀원 화면 (개인 알림)</h2>
              <p className="text-sm text-text-muted max-w-xs">
                부담 없이 1탭으로 응답할 수 있는 모바일 최적화된 앱 푸시/대시보드 알림
              </p>
            </div>
            
            <div className="relative mx-auto max-w-[360px]">
              {/* Decorative background glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary-light/30 rounded-[34px] blur-xl opacity-50 animate-pulse" />
              <div className="relative z-10">
                <TeamMemberCheckIn />
              </div>
            </div>
          </div>

          {/* Right Column: Leader Experience */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-2">
              <h2 className="text-2xl font-bold text-text-primary">2. 리더 화면 (결과 리포트)</h2>
              <p className="text-sm text-text-muted">
                누가 액션을 멈췄는지, 누가 목표 조정이 필요한지 한눈에 파악하는 대시보드
              </p>
            </div>
            
            <div className="relative">
              {/* Decorative background glow */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-surface to-sub-background rounded-[36px] blur-md opacity-50" />
              <div className="relative z-10">
                <LeaderReport />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
