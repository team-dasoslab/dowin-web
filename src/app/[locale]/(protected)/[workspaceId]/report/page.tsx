"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LeaderReport } from "./_components/LeaderReport";
import { ProtectedPageContainer, ProtectedPageHeader } from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { PageSidebarNav } from "@/components/PageSidebarNav";

import { useTranslations } from "next-intl";

export default function ReportPage() {
  const t = useTranslations("TeamCheckin");
  const [activeSection, setActiveSection] = useState("achievement");

  const menuGroups = useMemo(
    () => [
      { id: "achievement", label: t("weeklyAchievement") },
      { id: "history", label: t("checkinHistory") },
      { id: "attention", label: t("attentionItems") },
    ],
    [t]
  );

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById("main-scroll-container");
      if (!container) return;
      const scrollPosition = container.scrollTop + 150;
      let currentSectionId = activeSection;

      for (const group of menuGroups) {
        const el = document.getElementById(group.id);
        if (el && el.offsetTop <= scrollPosition) {
          currentSectionId = group.id;
        }
      }

      if (currentSectionId !== activeSection) {
        setActiveSection(currentSectionId);
      }
    };

    const container = document.getElementById("main-scroll-container");
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [activeSection, menuGroups]);

  return (
    <div className="min-h-screen">
      <ProtectedPageContainer className="space-y-6 lg:space-y-12">
        <ProtectedPageHeader
          title={t("reportPageTitle")}
        />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12 items-start">
          <PageSidebarNav
            items={menuGroups}
            activeId={activeSection}
          />

          <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12 pb-24 lg:pb-[60vh]">
            <LeaderReport />
          </div>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}
