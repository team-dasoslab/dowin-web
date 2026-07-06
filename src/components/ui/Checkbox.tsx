import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const checkboxVariants = cva(
  "rounded text-primary focus:ring-primary outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
  {
    variants: {
      size: {
        default: "h-4 w-4",
        sm: "h-3.5 w-3.5",
        lg: "h-5 w-5",
      },
      variant: {
        default: "border-border bg-white",
        ghost: "border-none bg-transparent",
        filled: "border-none bg-sub-background",
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof checkboxVariants> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(checkboxVariants({ size, variant, className }))}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";
