import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref?: React.Ref<HTMLInputElement>;
}

export const Input = ({ className, ref, ...props }: InputProps) => {
  return (
    <input
      className={className}
      ref={ref}
      {...props}
    />
  );
};

Input.displayName = "Input";
