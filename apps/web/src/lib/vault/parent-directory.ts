import type { ObsidNoteDefinitions, ObsidQuery, ObsidResolvedNote } from "obsid/schema";
import type { ObsidFolderReference, ObsidianNotePropertyValue } from "obsid/types";

interface DirectoryPageIdentity {
  readonly folder: ObsidFolderReference;
  readonly name: string;
  readonly webPath: string;
}

interface BackNavigation {
  readonly href: string;
  readonly title: string;
}

const getParentPagePaths = (folder: ObsidFolderReference): readonly string[] => {
  const segments = folder.vaultPath.split("/").filter(Boolean);

  if (segments.length < 2) {
    return [];
  }

  const parentSegments = segments.slice(0, -1);
  const parentFolder = parentSegments.join("/");
  const parentName = parentSegments.at(-1);

  return [
    `${parentFolder}/page`,
    ...(parentName
      ? [
          `${parentFolder}/page--${parentName}`,
        ]
      : []),
  ];
};

const toNoteReference = (path: string): ObsidianNotePropertyValue => ({
  path,
  raw: `[[${path}]]`,
  type: "note",
});

const getDirectoryTitle = (page: DirectoryPageIdentity): string =>
  page.folder.vaultPath.split("/").at(-1) || page.name;

const findParentDirectoryPage = async <Definitions extends ObsidNoteDefinitions>(
  folder: ObsidFolderReference,
  query: ObsidQuery<Definitions>,
): Promise<ObsidResolvedNote<Definitions> | null> => {
  for (const path of getParentPagePaths(folder)) {
    const page = await query.resolve(toNoteReference(path));

    if (page) {
      return page;
    }
  }

  return null;
};

const getParentDirectoryNavigation = async <Definitions extends ObsidNoteDefinitions>(
  page: DirectoryPageIdentity,
  query: ObsidQuery<Definitions>,
): Promise<BackNavigation | undefined> => {
  const parent = await findParentDirectoryPage(page.folder, query);

  if (!parent) {
    return;
  }

  return {
    href: parent.webPath,
    title: getDirectoryTitle(parent),
  };
};

export { getParentDirectoryNavigation, getParentPagePaths };
