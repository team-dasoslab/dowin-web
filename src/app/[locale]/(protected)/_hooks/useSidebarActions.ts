export const useSidebarActions = (
  pathname: string,
  filteredLinks: { href: string }[],
) => {
  const getIsActive = (href: string) => {
    const hrefPathname = href.split("?")[0];

    // 워크스페이스 하위 메뉴(billing, members, invites) 진입 시에도 '워크스페이스 설정' 메뉴가 active 되도록 예외 처리
    const isWorkspaceMenu =
      hrefPathname.endsWith("/settings") &&
      pathname.includes("/settings/");

    return (
      pathname === hrefPathname ||
      isWorkspaceMenu ||
      (hrefPathname !== "/" &&
        pathname.startsWith(hrefPathname + "/") &&
        !filteredLinks.some((link) => {
          const linkPathname = link.href.split("?")[0];
          return (
            linkPathname !== hrefPathname &&
            linkPathname.startsWith(hrefPathname + "/") &&
            pathname.startsWith(linkPathname)
          );
        }))
    );
  };

  return { getIsActive };
};
