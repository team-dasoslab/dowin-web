import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React from "react";

const badgeVariants = cva(
  "inline-flex items-center justify-center font-bold",
  {
    variants: {
      variant: {
        default:
          "px-2 py-0.5 rounded border border-border text-xs bg-surface text-text-primary",
        success:
          "px-2 py-0.5 rounded border border-success/20 text-xs bg-success/10 text-success",
        primary:
          "px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded border border-primary/20",
        danger:
          "px-2.5 py-1 rounded-full text-xs font-bold bg-danger/10 text-danger",
        secondary:
          "px-2 py-0.5 rounded-full text-[10px] font-bold bg-sub-background text-text-muted",
        "ghost-primary":
          "px-2 py-1 rounded-[8px] bg-primary/5 text-[10px] font-bold text-primary",
        "ghost-secondary":
          "px-2 py-1 rounded-[8px] bg-sub-background text-[10px] font-bold text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  ref?: React.Ref<HTMLSpanElement>;
}

export const Badge = ({ className, variant, ref, ...props }: BadgeProps) => {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  );
};

Badge.displayName = "Badge";
