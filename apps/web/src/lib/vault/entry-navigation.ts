interface EntryReference {
  readonly webPath: string;
}

interface NavigationItem {
  readonly href: string;
  readonly title: string;
}

interface EntryNavigationData {
  readonly next?: NavigationItem;
  readonly previous?: NavigationItem;
}

const getEntryNavigation = <Entry extends EntryReference>(
  entries: readonly Entry[],
  currentWebPath: string,
  getTitle: (entry: Entry) => string,
): EntryNavigationData => {
  const currentIndex = entries.findIndex((entry) => entry.webPath === currentWebPath);

  if (currentIndex < 0) {
    return {};
  }

  const toNavigationItem = (entry: Entry): NavigationItem => ({
    href: entry.webPath,
    title: getTitle(entry),
  });
  const previous = currentIndex > 0 ? entries[currentIndex - 1] : undefined;
  const next = entries[currentIndex + 1];

  return {
    ...(previous
      ? {
          previous: toNavigationItem(previous),
        }
      : {}),
    ...(next
      ? {
          next: toNavigationItem(next),
        }
      : {}),
  };
};

export { getEntryNavigation };
