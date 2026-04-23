import { cn } from "@/lib/utils";
import React from "react";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export function SectionHeader({
  title,
  description,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      <div className="flex items-center gap-4 px-1">
        <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-wider">
          {title}
        </h3>
        <div className="h-px flex-1 bg-zinc-200/60" />
      </div>
      {description && (
        <p className="px-1 text-[11px] text-text-muted leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

