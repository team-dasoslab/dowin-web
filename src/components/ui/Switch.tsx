import { cn } from "@/lib/utils";
import React from "react";

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!disabled) {
        onCheckedChange?.(!checked);
      }
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        ref={ref}
        className={cn(
          "relative inline-flex h-[22px] w-[42px] flex-shrink-0 items-center justify-start rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 p-0 min-h-0",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          checked ? "bg-primary" : "bg-border",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm ring-0 transition duration-300",
            checked ? "translate-x-[20px]" : "translate-x-0"
          )}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";
