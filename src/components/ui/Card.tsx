import { cn } from "@/lib/utils";
import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

export const Card = ({ className, ref, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "overflow-hidden border border-zinc-200 bg-white",
        className?.includes("rounded-") ? "" : "rounded-content",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
};

Card.displayName = "Card";
