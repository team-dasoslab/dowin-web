import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
  ref,
  autoCapitalize = "none",
  autoCorrect = "off",
  ...props
}: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? (label ? generatedId : undefined);
  const inputElement = (
    <div className="relative">
      <input
        id={inputId}
        className={cn(
          "h-[52px] w-full rounded-[16px] border-none bg-zinc-100 px-5 text-[15px] font-semibold text-zinc-900 outline-none transition-colors placeholder:text-zinc-500 focus:bg-white focus:ring-4 focus:ring-primary/5 disabled:opacity-50 disabled:cursor-not-allowed",
          rightElement ? "pr-14" : "",
          className
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
        className="text-sm block font-semibold text-zinc-900 ml-1"
      >
        {label}
      </label>
      {inputElement}
    </div>
  );
};

Input.displayName = "Input";
