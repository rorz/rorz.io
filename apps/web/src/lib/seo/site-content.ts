import {
  getNotePublishedAt,
  isIndexableNote,
  isInternalSitePath,
  isInternalVaultPath,
  isPublishedNote,
} from "@/lib/seo/content.ts";
import { getVaultRouteManifest, vault } from "@/lib/vault/index.ts";

type SiteNote = NonNullable<Awaited<ReturnType<typeof vault.getFile>>>;
type SiteRoute = ReturnType<typeof getVaultRouteManifest>["routes"][number];

interface SiteEntry {
  readonly note: SiteNote;
  readonly route: SiteRoute;
}

const loadSiteEntry = async (route: SiteRoute): Promise<SiteEntry> => {
  const note = await vault.getFile(route.vaultPath);

  if (!note) {
    throw new Error(`Vault route is missing its note: ${route.vaultPath}.md`);
  }

  return {
    note,
    route,
  };
};

const getPublishedSiteEntries = async (): Promise<readonly SiteEntry[]> => {
  const routes = getVaultRouteManifest().routes.filter(
    (route) => !(isInternalSitePath(route.webPath) || isInternalVaultPath(route.vaultPath)),
  );
  const entries = await Promise.all(routes.map(loadSiteEntry));
  return entries.filter(({ note }) => isPublishedNote(note));
};

const getIndexableSiteEntries = async (): Promise<readonly SiteEntry[]> =>
  (await getPublishedSiteEntries()).filter(({ note }) => isIndexableNote(note));

const getWritingPosts = async (): Promise<readonly SiteNote[]> => {
  const notes = await vault.getFolder("Writing");

  return notes
    .filter((note): note is SiteNote => note.kind === "post" && isPublishedNote(note))
    .toSorted(
      (left, right) =>
        (getNotePublishedAt(right)?.getTime() ?? 0) - (getNotePublishedAt(left)?.getTime() ?? 0),
    );
};

export { getIndexableSiteEntries, getPublishedSiteEntries, getWritingPosts };
