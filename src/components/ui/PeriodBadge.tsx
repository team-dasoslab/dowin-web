import { cn } from "@/lib/utils";
import { DowinIcon, type IconName } from "@/components/ui/DowinIcon";
import React from "react";

interface PeriodBadgeProps {
  label: string;
  iconName?: IconName;
  className?: string;
  size?: "sm" | "md";
}

export function PeriodBadge({
  label,
  iconName = "domain-calendar",
  className,
  size = "sm",
}: PeriodBadgeProps) {
  const isMd = size === "md";

  return (
    <div
      className={cn(
        "flex items-center rounded-[16px] bg-sub-background transition-all",
        isMd ? "gap-2 px-3 py-1.5" : "gap-1.5 px-2.5 py-1",
        className,
      )}
    >
      <DowinIcon
        name={iconName}
        size={isMd ? 16 : 14}
        className="text-text-muted"
      />
      <span
        className={cn(
          "font-bold tracking-tight text-text-secondary tabular-nums",
          isMd ? "text-[12px]" : "text-[11px]",
        )}
      >
        {label}
      </span>
    </div>
  );
}

