const PREVIOUS_PATH_KEY = "dowin.previousPath";

export const useSmartBackButtonActions = (
  router: { back: () => void; push: (href: string) => void },
  fallbackHref: string,
) => {
  const handleClick = () => {
    const previousPath = sessionStorage.getItem(PREVIOUS_PATH_KEY);

    if (previousPath) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return { handleClick };
};
