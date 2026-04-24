"use client";

import { useTranslations } from "next-intl";
import { WigIcon } from "@/components/ui/WigIcon";

export function SetupGuideCard() {
  const t = useTranslations("Setup.guide");

  return (
    <div className="p-5 bg-white border border-zinc-200 rounded-content space-y-4 animate-linear-in">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-primary/10 rounded-button flex items-center justify-center">
          <WigIcon name="status-info" size="14px" className="text-primary" />
        </div>
        <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">
          {t("title")}
        </h4>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-[13px] font-bold text-primary flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary rounded-full" />
            {t("lagTitle")}
          </p>
          <p className="text-[12px] text-zinc-500 leading-relaxed font-medium pl-2.5">
            {t("lagDesc")}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[13px] font-bold text-primary flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary rounded-full" />
            {t("leadTitle")}
          </p>
          <p className="text-[12px] text-zinc-500 leading-relaxed font-medium pl-2.5">
            {t("leadDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
