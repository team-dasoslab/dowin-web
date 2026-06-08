import { cn } from "@/lib/utils";
import React from "react";

type ProtectedPageContainerProps = {
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  spacing?: "default" | "compact";
  topPadding?: "default" | "compact";
};

export function ProtectedPageContainer({
  children,
  className,
  isLoading = false,
  spacing = "default",
  topPadding = "default",
}: ProtectedPageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto max-w-[1200px] px-4 pb-6 md:px-10 md:pb-10 lg:px-12 lg:pb-12",
        topPadding === "compact"
          ? "pt-2 md:pt-4 lg:pt-4"
          : "pt-4 md:pt-10 lg:pt-12",
        spacing === "compact" ? "space-y-4" : "space-y-10",
        isLoading ? "animate-pulse" : "animate-dowin-in",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ProtectedPageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
};

export function ProtectedPageHeader({
  title,
  rightElement,
  className,
}: ProtectedPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[24px] md:text-[32px] font-bold tracking-tight text-zinc-900">
          {title}
        </h1>
      </div>
      {rightElement ? (
        <div className="flex shrink-0 items-center gap-2">{rightElement}</div>
      ) : null}
    </header>
  );
}
