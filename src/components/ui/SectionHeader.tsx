import { cn } from "@/lib/utils";
import React from "react";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
}

export function SectionHeader({
  title,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center gap-4 px-1", className)} {...props}>
      <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-wider">
        {title}
      </h3>
      <div className="h-px flex-1 bg-zinc-200/60" />
    </div>
  );
}
