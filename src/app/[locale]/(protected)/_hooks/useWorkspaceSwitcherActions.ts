import { RefObject, useEffect } from "react";

export const useWorkspaceSwitcherActions = (
  containerRef: RefObject<HTMLDivElement | null>,
  setIsOpen: (isOpen: boolean) => void,
) => {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef, setIsOpen]);
};
