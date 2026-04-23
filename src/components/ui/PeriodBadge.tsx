import { cn } from "@/lib/utils";
import { CalendarLtr20Regular } from "@fluentui/react-icons";
import React from "react";

interface PeriodBadgeProps {
  label: string;
  icon?: React.ElementType;
  className?: string;
  size?: "sm" | "md";
}

export function PeriodBadge({
  label,
  icon: Icon = CalendarLtr20Regular,
  className,
  size = "sm",
}: PeriodBadgeProps) {
  const isMd = size === "md";

  return (
    <div
      className={cn(
        "flex items-center rounded-button border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all",
        isMd ? "gap-2 px-3 py-1.5" : "gap-1.5 px-2.5 py-1",
        className,
      )}
    >
      <Icon className={cn("text-zinc-400", isMd ? "h-4 w-4" : "h-3.5 w-3.5")} />
      <span
        className={cn(
          "font-bold tracking-tight text-zinc-600 tabular-nums",
          isMd ? "text-[12px]" : "text-[11px]",
        )}
      >
        {label}
      </span>
    </div>
  );
}

