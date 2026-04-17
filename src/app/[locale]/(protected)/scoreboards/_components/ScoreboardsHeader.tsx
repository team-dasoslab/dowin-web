"use client";

import { Button } from "@/components/ui/Button";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { Settings } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type ScoreboardsHeaderProps = {
  hasActiveScoreboard: boolean;
  workspaceName?: string;
};

export function ScoreboardsHeader({
  hasActiveScoreboard,
  workspaceName,
}: ScoreboardsHeaderProps) {
  const t = useTranslations("Scoreboard");

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <SmartBackButton className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] text-text-muted truncate">
            {workspaceName}
          </p>
          <h1 className="text-lg font-bold text-text-primary truncate">
            {t("archiveTitle")}
          </h1>
          <p className="text-xs text-text-muted">
            {t("archiveDesc")}
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
              {t("editScoreboard")}
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
