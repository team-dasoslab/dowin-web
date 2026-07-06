import React, { useId } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold",
  {
    variants: {
      variant: {
        default: "border-none bg-sub-background text-text-primary placeholder:text-text-muted focus:bg-surface focus:ring-4 focus:ring-primary/5",
        ghost: "border-none bg-transparent hover:bg-sub-background focus:bg-sub-background",
        outline: "border-2 border-border bg-transparent focus:border-primary/50",
      },
      size: {
        default: "h-[52px] rounded-[16px] px-5 text-[15px]",
        sm: "h-10 rounded-[12px] px-3 text-sm",
        md: "h-12 rounded-[14px] px-4 text-sm",
        lg: "h-14 rounded-[20px] px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface InputProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">, 
    VariantProps<typeof inputVariants> {
  label?: React.ReactNode;
  containerClassName?: string;
  rightElement?: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
}

export const Input = ({
  className,
  containerClassName,
  id,
  label,
  rightElement,
  variant,
  size,
  ref,
  autoCapitalize = "none",
  autoCorrect = "off",
  ...props
}: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? (label ? generatedId : undefined);
  const inputElement = (
    <div className="relative w-full">
      <input
        id={inputId}
        className={cn(
          inputVariants({ variant, size, className }),
          rightElement ? "pr-14" : ""
        )}
        ref={ref}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );

  if (!label) return inputElement;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <label
        htmlFor={inputId}
        className="text-sm block font-semibold text-text-primary ml-1"
      >
        {label}
      </label>
      {inputElement}
    </div>
  );
};

Input.displayName = "Input";
