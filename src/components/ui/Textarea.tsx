import React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  containerClassName?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export const Textarea = ({
  className,
  containerClassName,
  label,
  ref,
  autoCapitalize = "none",
  autoCorrect = "off",
  ...props
}: TextareaProps) => {
  const textareaElement = (
    <textarea
      className={cn(
        "min-h-[100px] w-full rounded-[16px] border-none bg-sub-background px-5 py-4 text-[15px] font-semibold text-text-primary outline-none transition-colors placeholder:text-text-muted focus:bg-surface focus:ring-4 focus:ring-primary/5 disabled:opacity-50 disabled:cursor-not-allowed resize-none",
        className
      )}
      ref={ref}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      {...props}
    />
  );

  if (!label) return textareaElement;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <label className="text-sm block font-semibold text-text-primary ml-1">
        {label}
      </label>
      {textareaElement}
    </div>
  );
};

Textarea.displayName = "Textarea";
