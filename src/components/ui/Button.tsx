import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "",
        primary: "bg-primary text-white font-bold border border-black/5 active:bg-primary-light rounded-[12px] hover:bg-primary/90", // added hover
        hero: "bg-zinc-950 dark:bg-black text-white disabled:bg-zinc-800 disabled:dark:bg-zinc-800 disabled:text-zinc-500 shadow-sm hover:bg-zinc-800 active:bg-zinc-700", 
        outline: "border border-border text-text-primary hover:bg-sub-background active:bg-border/50 disabled:bg-white disabled:text-text-muted",
        "outline-subtle": "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100",
        ghost: "hover:bg-sub-background active:bg-border/50 text-text-secondary disabled:bg-transparent disabled:text-text-muted/50",
        "ghost-primary": "bg-primary/10 text-primary font-bold hover:bg-primary/20 active:bg-primary/30",
        "primary-subtle": "bg-primary/15 text-primary shadow-none hover:bg-primary/25 active:bg-primary/30 disabled:bg-primary/10",
        "primary-ghost": "bg-primary/5 text-primary shadow-none hover:bg-primary/10 active:bg-primary/20 disabled:bg-transparent",
        danger: "bg-danger/10 text-danger font-bold hover:bg-danger/20 active:bg-danger/30",
        secondary: "bg-sub-background text-text-muted font-bold hover:bg-border/50 active:bg-border",
        subtle: "bg-sub-background text-text-secondary hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors active:bg-zinc-300",
        "solid-dark": "bg-text-primary text-white font-black hover:bg-text-primary/90 active:bg-text-primary/80 disabled:bg-text-primary/50",
      },
      size: {
        default: "",
        sm: "px-4 py-2 text-sm", // from default story
        primary: "px-5 py-3 text-sm", // from primary story
        lg: "h-14 px-12 text-[18px] font-bold rounded-button", // landing page
        xl: "h-[56px] px-6 text-[15px] rounded-[24px] font-semibold", // forms
        hero: "h-[56px] w-full px-8 gap-3 text-[16px] rounded-[24px] font-black", // from original buttonSizes
        icon: "w-8 h-8", // from icon story
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

export const Button = ({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp 
      className={cn(
        "rounded-2xl", // the original base had this, except hero overrides it
        buttonVariants({ variant, size, className })
      )} 
      ref={ref} 
      {...props} 
    />
  );
};

Button.displayName = "Button";
