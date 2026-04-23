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
        "mx-auto max-w-[1200px] px-6 pb-6 md:px-10 md:pb-10 lg:px-12 lg:pb-12",
        topPadding === "compact" ? "pt-2 md:pt-4 lg:pt-4" : "pt-6 md:pt-10 lg:pt-12",
        spacing === "compact" ? "space-y-4" : "space-y-10",
        isLoading ? "animate-pulse" : "animate-linear-in",
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
  className?: string;
};

export function ProtectedPageHeader({
  title,
  description,
  className,
}: ProtectedPageHeaderProps) {
  return (
    <header className={cn("px-1", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-black tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm font-medium text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
