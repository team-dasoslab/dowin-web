import { Input, type InputProps } from "@/components/ui/Input";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
      <Input
        {...props}
        type={isVisible ? "text" : "password"}
        className={className}
        rightElement={
          <button
            type="button"
            onClick={() => setIsVisible((previous) => !previous)}
            className={cn(
              "flex items-center text-text-muted hover:text-text-secondary transition-colors",
              toggleClassName
            )}
          >
            {isVisible ? (
              <DowinIcon name="auth-eye-off" size="18px" />
            ) : (
              <DowinIcon name="auth-eye" size="18px" />
            )}
          </button>
        }
      />
    </div>
  );
};

PasswordInput.displayName = "PasswordInput";
