import { cn } from "@/lib/utils";
import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  description,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-content border border-zinc-200 bg-zinc-50/50 px-3 py-2",
        className,
      )}
    >
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className={cn("font-mono text-lg font-bold text-text-primary", valueClassName)}>
        {value}
      </p>
      {description && (
        <p className="mt-0.5 text-[10px] text-text-muted">{description}</p>
      )}
    </div>
  );
}
