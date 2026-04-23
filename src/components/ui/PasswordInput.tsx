import { Input, type InputProps } from "@/components/ui/Input";
import { Eye20Regular, EyeOff20Regular } from "@fluentui/react-icons";
import { useTranslations } from "next-intl";
import { useState } from "react";

type PasswordInputProps = Omit<InputProps, "type"> & {
  toggleClassName?: string;
  toggleLabelClassName?: string;
  wrapperClassName?: string;
};

export const PasswordInput = ({
  className,
  toggleClassName,
  toggleLabelClassName,
  wrapperClassName,
  ...props
}: PasswordInputProps) => {
  const t = useTranslations("Common");
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
            <EyeOff20Regular className="h-3.5 w-3.5" />
          ) : (
            <Eye20Regular className="h-3.5 w-3.5" />
          )}
          <span className={toggleLabelClassName}>
            {isVisible ? t("hide") : t("show")}
          </span>
        </button>
      </div>
    </div>
  );
};

PasswordInput.displayName = "PasswordInput";
