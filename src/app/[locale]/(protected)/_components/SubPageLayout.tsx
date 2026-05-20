"use client";

import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { useTranslations } from "next-intl";
import React from "react";

export function SubPageLayout({
  children,
  showBackButton = true,
}: {
  children: React.ReactNode;
  showBackButton?: boolean;
}) {
  const tc = useTranslations("Common");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {showBackButton && (
        <div className="mx-auto w-full max-w-[1200px] px-6 pt-6 md:px-10 md:pt-10 lg:px-12 lg:pt-12 pb-0">
          <SmartBackButton
            className="flex h-auto w-fit items-center gap-1.5 border-none bg-transparent p-0 text-[13px] font-bold text-zinc-400 shadow-none transition-colors"
            iconClassName="h-5 w-5"
          >
            {tc("back")}
          </SmartBackButton>
        </div>
      )}
      <div
        className={`flex-1 w-full ${showBackButton ? "[&>div]:min-h-0 [&>div]:bg-transparent [&>div>div]:pt-4" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
