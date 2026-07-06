export const usePageSidebarNavActions = (onSelect?: (id: string) => void) => {
  const handleSelect = (id: string) => {
    if (onSelect) {
      onSelect(id);
      return;
    }
    const element = document.getElementById(id);
    const container = document.getElementById("main-scroll-container");
    if (container && element) {
      const headerOffset = 100;
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;
      container.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return { handleSelect };
};
