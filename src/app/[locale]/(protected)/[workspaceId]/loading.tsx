"use client";

import { ProtectedPageContainer } from "@/app/[locale]/(protected)/_components/ProtectedPageShell";

export default function WorkspaceLoading() {
  return (
    <ProtectedPageContainer isLoading className="space-y-6 lg:space-y-12">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="h-8 md:h-10 w-48 md:w-64 rounded-[12px] bg-border/60" />
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-[16px] bg-border/40" />
          <div className="h-8 w-24 rounded-[16px] bg-border/40" />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-12 items-start">
        {/* 2. Sidebar Nav Skeleton (Mobile Hidden, Desktop 240px) */}
        <aside className="hidden lg:block lg:w-[240px] space-y-2">
          <div className="h-[48px] w-full rounded-[14px] bg-border/50" />
          <div className="h-[48px] w-full rounded-[14px] bg-border/30" />
          <div className="h-[48px] w-full rounded-[14px] bg-border/30" />
        </aside>

        {/* 3. Main Content Area Skeleton */}
        <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12 pb-24 lg:pb-48">
          {/* Section 1 (Grid) */}
          <section className="space-y-4">
            <div className="h-6 w-32 rounded-md bg-border/60" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-48 rounded-[24px] bg-border/40" />
              <div className="h-48 rounded-[24px] bg-border/40" />
            </div>
          </section>

          {/* Section 2 (Large Content / Graph) */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 w-40 rounded-md bg-border/60" />
              <div className="h-8 w-32 rounded-md bg-border/40" />
            </div>
            <div className="h-[400px] w-full rounded-[24px] bg-border/30" />
          </section>
        </div>
      </div>
    </ProtectedPageContainer>
  );
}
