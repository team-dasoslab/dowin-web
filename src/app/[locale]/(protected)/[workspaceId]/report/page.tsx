"use client";

import React from "react";
import { LeaderReport } from "./_components/LeaderReport";
import { ProtectedPageContainer, ProtectedPageHeader } from "@/app/[locale]/(protected)/_components/ProtectedPageShell";

import { useTranslations } from "next-intl";

export default function ReportPage() {
  const t = useTranslations("TeamCheckin");
  return (
    <div className="min-h-screen">
      <ProtectedPageContainer className="space-y-6 lg:space-y-12">
        <ProtectedPageHeader
          title={t("reportPageTitle")}
        />
        <div className="w-full flex-1 pb-24 lg:pb-[60vh] max-w-5xl">
          <LeaderReport />
        </div>
      </ProtectedPageContainer>
    </div>
  );
}
