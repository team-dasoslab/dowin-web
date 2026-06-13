import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import React from "react";

const buttonVariants = {
  default: "",
  hero: "bg-zinc-950 dark:bg-black text-white disabled:bg-zinc-800 disabled:dark:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed shadow-sm transition-all",
};

const buttonSizes = {
  default: "",
  hero: "h-[56px] w-full px-8 gap-3 text-[16px] rounded-[24px] font-black",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  ref?: React.Ref<HTMLButtonElement>;
}

export const Button = ({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ref,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp 
      className={cn(
        "inline-flex items-center justify-center rounded-2xl", 
        buttonVariants[variant],
        buttonSizes[size],
        className
      )} 
      ref={ref} 
      {...props} 
    />
  );
};

Button.displayName = "Button";
