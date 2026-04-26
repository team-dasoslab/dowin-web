import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref?: React.Ref<HTMLInputElement>;
}

export const Input = ({ className, ref, autoCapitalize = "none", autoCorrect = "off", ...props }: InputProps) => {
  return (
    <input
      className={className}
      ref={ref}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      {...props}
    />
  );
};

Input.displayName = "Input";
