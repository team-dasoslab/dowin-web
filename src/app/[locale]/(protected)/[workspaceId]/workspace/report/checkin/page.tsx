"use client";

import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { useActiveSectionScroll } from "@/hooks/useActiveSectionScroll";
import { useMemo } from "react";
import { LeaderReport } from "./_components/LeaderReport";

import { PageSidebarNav } from "@/components/PageSidebarNav";

import { useTranslations } from "next-intl";

export default function ReportPage() {
  const t = useTranslations("TeamCheckin");
  const menuGroups = useMemo(
    () => [
      { id: "achievement", label: t("weeklyAchievement") },
      { id: "attention", label: t("attentionItems") },
      { id: "history", label: t("checkinHistory") },
    ],
    [t],
  );

  const [activeSection, setActiveSection] = useActiveSectionScroll(
    menuGroups,
    "achievement",
  );

  return (
    <div className="min-h-screen">
      <ProtectedPageContainer className="space-y-6 lg:space-y-12">
        <ProtectedPageHeader title={t("reportPageTitle")} />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12 items-start">
          <PageSidebarNav items={menuGroups} activeId={activeSection} />

          <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12 pb-24 lg:pb-[60vh]">
            <LeaderReport />
          </div>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}
