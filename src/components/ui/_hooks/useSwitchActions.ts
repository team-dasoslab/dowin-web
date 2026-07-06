import React from "react";

export const useSwitchActions = (
  checked: boolean,
  onCheckedChange?: (checked: boolean) => void,
  disabled?: boolean,
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void,
) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!disabled) {
      onCheckedChange?.(!checked);
    }
  };

  return { handleClick };
};
