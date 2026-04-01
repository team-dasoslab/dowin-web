"use client";

import { Button } from "@/components/ui/Button";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { Settings } from "lucide-react";
import Link from "next/link";

type ScoreboardsHeaderProps = {
  hasActiveScoreboard: boolean;
  workspaceName?: string;
};

export function ScoreboardsHeader({
  hasActiveScoreboard,
  workspaceName,
}: ScoreboardsHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <SmartBackButton className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] text-text-muted truncate">
            {workspaceName}
          </p>
          <h1 className="text-lg font-bold text-text-primary truncate">
            점수판 보관함
          </h1>
          <p className="text-xs text-text-muted">
            내가 만든 점수판 전체를 보고, 활성/보관 상태를 바꿉니다.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hasActiveScoreboard ? (
          <Button
            asChild
            className="px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5"
          >
            <Link href="/setup?mode=update">
              <Settings className="w-3.5 h-3.5 text-text-muted" />
              현재 점수판 수정
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
