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
    <div className="flex min-h-screen flex-col bg-[#F2F4F6]">
      {showBackButton && (
        <div className="mx-auto w-full max-w-[1200px] px-6 pt-6 md:px-10 md:pt-10 lg:px-12 lg:pt-12 pb-0">
          <SmartBackButton
            className="flex h-10 w-10 items-center justify-center -ml-2 rounded-full bg-transparent p-0 text-zinc-900 transition-colors hover:bg-black/5 active:bg-black/10"
            iconClassName="h-6 w-6"
            aria-label={tc("back")}
          />
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
