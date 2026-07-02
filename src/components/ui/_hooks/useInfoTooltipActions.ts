import { RefObject, useEffect } from "react";

export const useInfoTooltipActions = (
  open: boolean,
  setOpen: (open: boolean) => void,
  ref: RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open, setOpen, ref]);
};
