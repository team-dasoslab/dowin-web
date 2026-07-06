import React, { useId } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "w-full resize-y outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium",
  {
    variants: {
      variant: {
        default: "border-none bg-sub-background text-text-primary placeholder:text-text-muted focus:bg-surface focus:ring-4 focus:ring-primary/5",
        ghost: "border-none bg-transparent hover:bg-sub-background focus:bg-sub-background",
        outline: "border-2 border-border bg-surface focus:border-text-primary",
      },
      size: {
        default: "min-h-[100px] rounded-[16px] px-5 py-4 text-[15px] leading-relaxed",
        sm: "min-h-[80px] rounded-[12px] px-4 py-3 text-sm leading-relaxed",
        lg: "min-h-[160px] rounded-[20px] p-5 text-[15px] leading-relaxed",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface TextareaProps 
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: React.ReactNode;
  containerClassName?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export const Textarea = ({
  className,
  containerClassName,
  id,
  label,
  variant,
  size,
  ref,
  autoCapitalize = "none",
  autoCorrect = "off",
  ...props
}: TextareaProps) => {
  const generatedId = useId();
  const textareaId = id ?? (label ? generatedId : undefined);
  const textareaElement = (
    <textarea
      id={textareaId}
      className={cn(textareaVariants({ variant, size, className }))}
      ref={ref}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      {...props}
    />
  );

  if (!label) return textareaElement;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <label 
        htmlFor={textareaId}
        className="text-sm block font-semibold text-text-primary ml-1"
      >
        {label}
      </label>
      {textareaElement}
    </div>
  );
};

Textarea.displayName = "Textarea";
