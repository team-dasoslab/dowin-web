import { useEffect, useState } from "react";

export function useActiveSectionScroll(
  menuGroups: { id: string }[],
  initialSectionId: string,
  containerId: string = "main-scroll-container",
  offset: number = 150
) {
  const [activeSection, setActiveSection] = useState(initialSectionId);

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById(containerId);
      if (!container) return;
      const scrollPosition = container.scrollTop + offset;
      let currentSectionId = activeSection;

      for (const group of menuGroups) {
        const el = document.getElementById(group.id);
        if (el && el.offsetTop <= scrollPosition) {
          currentSectionId = group.id;
        }
      }

      if (currentSectionId !== activeSection) {
        setActiveSection(currentSectionId);
      }
    };

    const container = document.getElementById(containerId);
    container?.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial run
    handleScroll();
    
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [activeSection, menuGroups, containerId, offset]);

  return [activeSection, setActiveSection] as const;
}
