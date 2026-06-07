import { cn } from "@/lib/utils";
import React from "react";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: React.ReactNode;
}

export function SectionHeader({
  title,
  badge,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn("px-1 mb-4", className)} {...props}>
      <div className="flex items-center gap-2">
        <h2 className="text-[22px] font-bold tracking-tight text-zinc-900">
          {title}
        </h2>
        {badge && <div>{badge}</div>}
      </div>
    </div>
  );
}

