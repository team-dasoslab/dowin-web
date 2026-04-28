import { Input, type InputProps } from "@/components/ui/Input";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useState } from "react";

type PasswordInputProps = Omit<InputProps, "type"> & {
  toggleClassName?: string;
  wrapperClassName?: string;
};

export const PasswordInput = ({
  className,
  toggleClassName,
  wrapperClassName,
  ...props
}: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={wrapperClassName}>
      <div className="relative">
        <Input
          {...props}
          type={isVisible ? "text" : "password"}
          className={className}
        />
        <button
          type="button"
          onClick={() => setIsVisible((previous) => !previous)}
          className={toggleClassName}
        >
          {isVisible ? (
            <DowinIcon name="auth-eye-off" size="14px" />
          ) : (
            <DowinIcon name="auth-eye" size="14px" />
          )}
        </button>
      </div>
    </div>
  );
};

PasswordInput.displayName = "PasswordInput";
