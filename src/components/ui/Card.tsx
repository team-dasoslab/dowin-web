import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React from "react";

const cardVariants = cva(
  "overflow-hidden",
  {
    variants: {
      variant: {
        default: "border border-border bg-surface",
        subtle: "border-none bg-surface",
        outline: "border border-border bg-transparent",
        white: "border-none bg-white",
        "white-outline": "border border-zinc-200 bg-white",
      },
      padding: {
        none: "p-0",
        sm: "p-4 sm:p-5",
        default: "p-5 sm:p-6",
        lg: "p-6 sm:p-8",
        xl: "p-8 md:p-12",
      },
      radius: {
        none: "rounded-none",
        md: "rounded-[12px]",
        default: "rounded-content",
        lg: "rounded-xl",
        xl: "rounded-[24px]",
        "2xl": "rounded-[1.75rem]",
      },
      shadow: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        xl: "shadow-xl shadow-zinc-200/50",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "none",
      radius: "default",
      shadow: "none",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  ref?: React.Ref<HTMLDivElement>;
}

export const Card = ({
  className,
  variant,
  padding,
  radius,
  shadow,
  ref,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn(cardVariants({ variant, padding, radius, shadow }), className)}
      ref={ref}
      {...props}
    />
  );
};

Card.displayName = "Card";
