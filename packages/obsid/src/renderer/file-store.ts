import { createObsidianFile, type ObsidianFile } from "./markdown.tsx";

type FileLoader = () => Promise<string>;
type FileLoaders = Readonly<Record<string, FileLoader>>;
type GetFile = (vaultName: string, path: string) => Promise<ObsidianFile | null>;

const leadingSlashPattern = /^\/+/u;
const markdownExtensionPattern = /\.md$/iu;
const vaultRoot = "/.obsidian-vaults";

const normalizePath = (path: string): string | null => {
  const normalized = path
    .replaceAll("\\", "/")
    .replace(leadingSlashPattern, "")
    .replace(markdownExtensionPattern, "");
  const segments = normalized.split("/");

  if (
    normalized.length === 0 ||
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    return null;
  }

  return normalized;
};

const normalizeVaultName = (vaultName: string): string | null => {
  if (
    vaultName.length === 0 ||
    vaultName === "." ||
    vaultName === ".." ||
    vaultName.includes("/") ||
    vaultName.includes("\\")
  ) {
    return null;
  }

  return vaultName;
};

const getFileFromLoaders = async (
  loaders: FileLoaders,
  vaultName: string,
  path: string,
): Promise<ObsidianFile | null> => {
  const normalizedVaultName = normalizeVaultName(vaultName);
  const normalizedPath = normalizePath(path);

  if (!(normalizedVaultName && normalizedPath)) {
    return null;
  }

  const load = loaders[`${vaultRoot}/${normalizedVaultName}/${normalizedPath}.md`];

  if (!load) {
    return null;
  }

  return createObsidianFile(normalizedPath, await load());
};

export type { GetFile };
export { getFileFromLoaders };
