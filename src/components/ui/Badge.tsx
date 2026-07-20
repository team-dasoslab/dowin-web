import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React from "react";

export const badgeVariants = cva(
  "inline-flex items-center justify-center font-bold",
  {
    variants: {
      variant: {
        default: "border border-border bg-surface text-text-primary",
        success: "border border-success/20 bg-success/10 text-success",
        primary: "border border-primary/20 bg-primary/10 text-primary",
        info: "border border-blue-500/20 bg-blue-500/10 text-blue-600",
        warning: "bg-amber-500/10 text-amber-500",
        danger: "bg-danger/10 text-danger",
        secondary: "bg-sub-background text-text-muted",
        "ghost-primary": "bg-primary/5 text-primary",
        "ghost-secondary": "bg-sub-background text-text-secondary",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        default: "px-2 py-0.5 text-xs",
        lg: "px-2.5 py-1 text-xs",
      },
      shape: {
        default: "rounded-[6px]",
        pill: "rounded-full",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  ref?: React.Ref<HTMLSpanElement>;
}

export const Badge = ({ className, variant, size, shape, ref, ...props }: BadgeProps) => {
  return (
    <span
      className={cn(badgeVariants({ variant, size, shape }), className)}
      ref={ref}
      {...props}
    />
  );
};

Badge.displayName = "Badge";
