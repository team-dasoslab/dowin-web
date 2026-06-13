import { cn } from "@/lib/utils";
import React from "react";

export type HeroIconBoxProps = React.HTMLAttributes<HTMLDivElement>;

export function HeroIconBox({ className, children, ...props }: HeroIconBoxProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-start",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
