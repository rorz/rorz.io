const isActiveNavigationPath = (pathname: string, href: string): boolean => {
  if (href.startsWith("#")) {
    return false;
  }

  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export { isActiveNavigationPath };
