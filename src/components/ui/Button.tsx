import { Slot } from "@radix-ui/react-slot";
import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

export const Button = ({ className, asChild = false, ref, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={className}
      ref={ref}
      {...props}
    />
  );
};

Button.displayName = "Button";
