"use client";

import { Card } from "@/components/ui/Card";

export default function ProtectedNoSidebarLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="max-w-[480px] w-full p-8 space-y-8 animate-pulse" radius="xl" variant="subtle">
        {/* 아이콘/로고 스켈레톤 */}
        <div className="h-12 w-12 rounded-full bg-border/40" />

        <div className="space-y-4">
          {/* 제목 영역 스켈레톤 */}
          <div className="h-8 w-48 rounded-md bg-border/60" />
          <div className="h-4 w-64 rounded-md bg-border/40" />
        </div>

        {/* 폼/내용 스켈레톤 */}
        <div className="space-y-4 pt-4">
          <div className="h-12 w-full rounded-[14px] bg-border/30" />
          <div className="h-12 w-full rounded-[14px] bg-border/30" />
        </div>

        {/* 버튼 스켈레톤 */}
        <div className="pt-4">
          <div className="h-14 w-full rounded-2xl bg-border/50" />
        </div>
      </Card>
    </div>
  );
}
