import { cn } from "@/lib/utils";
import React from "react";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function SectionHeader({
  title,
  badge,
  rightElement,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn("px-1 mb-4 flex items-center justify-between", className)} {...props}>
      <div className="flex items-center gap-2">
        <h2 className="text-[18px] md:text-[22px] font-bold tracking-tight text-text-primary">
          {title}
        </h2>
        {badge && <div>{badge}</div>}
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );
}

