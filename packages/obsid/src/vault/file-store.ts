import type {
  ObsidResolveFolderForSchema,
  ObsidResolveNoteForSchema,
  ObsidSchemaShape,
} from "../config/schema.ts";
import type { ObsidFolderReference } from "../types/reference.ts";
import { parseVaultSource } from "./frontmatter.ts";
import type { ObsidVault, ObsidVaultFile, VaultConfig, VaultName } from "./types.ts";
import { normalizeVaultsFolder } from "./vault-path.ts";
import { createVaultLinks, resolveFrontmatterLinks, resolveVaultPath } from "./wiki-link.ts";

type FileLoader = () => Promise<string>;
type FileLoaders = Readonly<Record<string, FileLoader>>;

const leadingSlashPattern = /^\/+/u;
const markdownExtension = ".md";
const markdownExtensionPattern = /\.md$/iu;
const trailingSlashPattern = /\/+$/u;

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

const normalizeFolderPath = (path: string): string | null => {
  const normalized = path
    .replaceAll("\\", "/")
    .replace(leadingSlashPattern, "")
    .replace(trailingSlashPattern, "");

  if (normalized.length === 0) {
    return "";
  }

  const segments = normalized.split("/");

  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    return null;
  }

  return normalized;
};

const getParentFolderPath = (path: string): string => {
  const separatorIndex = path.lastIndexOf("/");

  if (separatorIndex === -1) {
    return "";
  }

  return path.slice(0, separatorIndex);
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

const getVaultPaths = (
  loaders: FileLoaders,
  vaultRoot: string,
  vaultName: string,
): readonly string[] => {
  const prefix = `${vaultRoot}/${vaultName}/`;

  return Object.keys(loaders)
    .flatMap((loaderPath) => {
      if (
        !(loaderPath.startsWith(prefix) && loaderPath.toLowerCase().endsWith(markdownExtension))
      ) {
        return [];
      }

      return [
        loaderPath.slice(prefix.length, -markdownExtension.length),
      ];
    })
    .toSorted();
};

const getFolderPaths = (vaultPaths: readonly string[], folderPath: string): readonly string[] => {
  let prefix = "";

  if (folderPath) {
    prefix = `${folderPath}/`;
  }

  return vaultPaths.filter((path) => {
    if (!path.startsWith(prefix)) {
      return false;
    }

    return !path.slice(prefix.length).includes("/");
  });
};

// biome-ignore lint/complexity/useMaxParams: This test seam exposes the complete file identity plus its schema.
const getFileFromLoaders = async <Schema extends ObsidSchemaShape>(
  loaders: FileLoaders,
  vaultsFolder: string,
  vaultName: string,
  path: string,
  schema: Schema,
): Promise<ObsidVaultFile<Schema> | null> => {
  const vaultRoot = normalizeVaultsFolder(vaultsFolder);
  const normalizedVaultName = normalizeVaultName(vaultName);
  const normalizedPath = normalizePath(path);

  if (!(vaultRoot && normalizedVaultName && normalizedPath)) {
    return null;
  }

  const load = loaders[`${vaultRoot}/${normalizedVaultName}/${normalizedPath}.md`];

  if (!load) {
    return null;
  }

  const source = await load();
  const parsedSource = parseVaultSource(source, normalizedPath, schema);
  const vaultPaths = getVaultPaths(loaders, vaultRoot, normalizedVaultName);
  const currentFolder: ObsidFolderReference = {
    kind: "folder",
    path: getParentFolderPath(normalizedPath),
  };
  const resolveNote: ObsidResolveNoteForSchema<Schema> = (reference) => {
    const resolvedPath = resolveVaultPath(reference.path, normalizedPath, vaultPaths);

    if (!resolvedPath) {
      return Promise.resolve(null);
    }

    return getFileFromLoaders(loaders, vaultsFolder, normalizedVaultName, resolvedPath, schema);
  };
  const resolveFolder: ObsidResolveFolderForSchema<Schema> = async (reference) => {
    const folderPath = normalizeFolderPath(reference.path);

    if (folderPath === null) {
      return [];
    }

    const files = (await Promise.all(
      getFolderPaths(vaultPaths, folderPath).map((filePath) =>
        getFileFromLoaders(loaders, vaultsFolder, normalizedVaultName, filePath, schema),
      ),
    )) as Array<ObsidVaultFile<Schema> | null>;

    return files.filter((file): file is ObsidVaultFile<Schema> => file !== null);
  };

  return {
    ...parsedSource,
    currentFolder,
    frontmatter: resolveFrontmatterLinks({
      currentPath: normalizedPath,
      frontmatter: parsedSource.frontmatter,
      vaultPaths,
    }),
    links: createVaultLinks({
      body: parsedSource.body,
      currentPath: normalizedPath,
      frontmatter: parsedSource.frontmatter,
      vaultPaths,
    }),
    path: normalizedPath,
    resolveFolder,
    resolveNote,
    source,
  };
};

const getVaultFromLoaders = <
  const Config extends VaultConfig,
  const Schema extends ObsidSchemaShape,
>(
  loaders: FileLoaders,
  config: Config,
  schema: Schema,
  name: NoInfer<VaultName<Config>>,
): ObsidVault<Schema, VaultName<Config>> => {
  if (!config.vaults.some((vault) => vault.name === name)) {
    throw new Error(`Unknown vault: ${name}`);
  }

  const vaultRoot = normalizeVaultsFolder(config.vaultsFolder);

  if (!vaultRoot) {
    throw new Error(`Invalid vaults folder: ${config.vaultsFolder}`);
  }

  const paths = getVaultPaths(loaders, vaultRoot, name);
  const getFile = (path: string) =>
    getFileFromLoaders(loaders, config.vaultsFolder, name, path, schema);

  return {
    getFile,
    getFolder: async (path) => {
      const folderPath = normalizeFolderPath(path);

      if (folderPath === null) {
        return [];
      }

      const files = (await Promise.all(
        getFolderPaths(paths, folderPath).map((filePath) => getFile(filePath)),
      )) as Array<ObsidVaultFile<Schema> | null>;

      return files.filter((file): file is ObsidVaultFile<Schema> => file !== null);
    },
    name,
    paths,
  };
};

export { getFileFromLoaders, getVaultFromLoaders };
