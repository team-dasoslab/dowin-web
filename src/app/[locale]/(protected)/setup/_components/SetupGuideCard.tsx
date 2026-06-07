"use client";

import { useTranslations } from "next-intl";
import { DowinIcon } from "@/components/ui/DowinIcon";

export function SetupGuideCard() {
  const t = useTranslations("Setup.guide");

  return (
    <div className="p-6 bg-white border-none rounded-[24px] space-y-5 animate-dowin-in">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#E8F3FF] rounded-full flex items-center justify-center">
          <DowinIcon name="status-info" size="18px" className="text-primary" />
        </div>
        <h4 className="text-[14px] font-bold text-zinc-900 tracking-tight">
          {t("title")}
        </h4>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-[15px] font-bold text-primary flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            {t("lagTitle")}
          </p>
          <p className="text-[14px] text-zinc-500 leading-relaxed font-medium pl-3.5">
            {t("lagDesc")}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[15px] font-bold text-primary flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            {t("leadTitle")}
          </p>
          <p className="text-[14px] text-zinc-500 leading-relaxed font-medium pl-3.5">
            {t("leadDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
