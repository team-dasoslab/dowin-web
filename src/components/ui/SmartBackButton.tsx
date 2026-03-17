"use client";

import { Button, type ButtonProps } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const PREVIOUS_PATH_KEY = "wig.previousPath";

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
      aria-label={ariaLabel ?? "뒤로 가기"}
      className={className}
      disabled={disabled}
      onClick={handleClick}
      type={type}
      {...props}
    >
      <ArrowLeft className={iconClassName ?? "h-3.5 w-3.5"} />
    </Button>
  );
}
