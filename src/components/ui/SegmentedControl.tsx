import { ReactNode } from "react";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
  className = "",
  size = "md",
}: SegmentedControlProps<T>) {
  const containerClasses = {
    sm: "p-1 h-10 rounded-[16px]",
    md: "p-1 h-10 rounded-[16px]",
    lg: "p-1 h-12 rounded-[16px]",
  };

  const buttonClasses = {
    sm: "px-3 py-1.5 text-[12px] rounded-[12px]",
    md: "px-4 py-1.5 text-[13px] rounded-[12px]",
    lg: "px-6 py-2 text-[14px] rounded-[12px]",
  };

  return (
    <div
      className={`inline-flex shrink-0 bg-border/50 ${containerClasses[size]} ${className}`}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`flex-1 font-black whitespace-nowrap transition-all ${buttonClasses[size]} ${
              isActive
                ? "bg-white dark:bg-black text-zinc-900 dark:text-white shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
