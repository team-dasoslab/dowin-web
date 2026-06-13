"use client";

import { Button, type ButtonProps } from "@/components/ui/Button";
import { useRouter } from "@/i18n/routing";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const PREVIOUS_PATH_KEY = "dowin.previousPath";

type SmartBackButtonProps = Omit<ButtonProps, "onClick"> & {
  fallbackHref?: string;
  iconClassName?: string;
};

export function SmartBackButton({
  className,
  disabled,
  fallbackHref = "/",
  iconClassName,
  type = "button",
  ...props
}: SmartBackButtonProps) {
  const t = useTranslations("Common");
  const router = useRouter();
  const ariaLabel = props["aria-label"];

  const handleClick = () => {
    const previousPath = sessionStorage.getItem(PREVIOUS_PATH_KEY);

    if (previousPath) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <Button
      aria-label={ariaLabel ?? t("back")}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-sub-background text-text-secondary transition-transform active:scale-95",
        className
      )}
      disabled={disabled}
      onClick={handleClick}
      type={type}
      {...props}
    >
      <DowinIcon name="nav-back" className={iconClassName} size="16px" />
      {props.children}
    </Button>
  );
}
