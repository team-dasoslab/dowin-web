"use client";

import { useTranslations } from "next-intl";

type ScoreboardsHeaderProps = Record<string, never>;

export function ScoreboardsHeader({}: ScoreboardsHeaderProps) {
  const t = useTranslations("Scoreboard");

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black text-slate-900 tracking-tight">
            {t("archiveTitle")}
          </h1>
          <p className="text-xs text-slate-500">
            {t("archiveDesc")}
          </p>
        </div>
      </div>
    </header>
  );
}
