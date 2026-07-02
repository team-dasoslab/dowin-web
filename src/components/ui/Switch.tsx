import { useSwitchActions } from "@/components/ui/_hooks/useSwitchActions";
import { getSwitchTranslateClass } from "@/components/ui/_utils/switch";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const switchVariants = cva(
  "relative inline-flex flex-shrink-0 items-center justify-start rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 p-0 min-h-0",
  {
    variants: {
      size: {
        default: "h-[22px] w-[42px]",
        sm: "h-4 w-7",
        lg: "h-6 w-11",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const thumbVariants = cva(
  "pointer-events-none inline-block transform rounded-full bg-surface shadow-sm ring-0 transition duration-300",
  {
    variants: {
      size: {
        default: "h-[18px] w-[18px]",
        sm: "h-3 w-3",
        lg: "h-[20px] w-[20px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface SwitchProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">,
    VariantProps<typeof switchVariants> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      size,
      checked = false,
      onCheckedChange,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const { handleClick } = useSwitchActions(
      checked,
      onCheckedChange,
      disabled,
      onClick,
    );

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        ref={ref}
        className={cn(
          switchVariants({ size }),
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          checked ? "bg-primary" : "bg-border",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            thumbVariants({ size }),
            getSwitchTranslateClass(checked, size),
          )}
        />
      </button>
    );
  },
);

Switch.displayName = "Switch";
