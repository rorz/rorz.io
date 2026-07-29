import { getWebPath } from "../config/routing.ts";
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
type VaultFileLoader<Schema extends ObsidSchemaShape> = (
  vaultPath: string,
) => Promise<ObsidVaultFile<Schema> | null>;

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

const loadFolderFiles = async <Schema extends ObsidSchemaShape>(
  vaultPaths: readonly string[],
  folderPath: string,
  getFile: VaultFileLoader<Schema>,
): Promise<readonly ObsidVaultFile<Schema>[]> => {
  const files = (await Promise.all(
    getFolderPaths(vaultPaths, folderPath).map((filePath) => getFile(filePath)),
  )) as Array<ObsidVaultFile<Schema> | null>;

  return files.filter((file): file is ObsidVaultFile<Schema> => file !== null);
};

const createFileResolvers = <Schema extends ObsidSchemaShape>(
  getFile: VaultFileLoader<Schema>,
  currentPath: string,
  vaultPaths: readonly string[],
): {
  resolveFolder: ObsidResolveFolderForSchema<Schema>;
  resolveNote: ObsidResolveNoteForSchema<Schema>;
} => {
  const resolveNote: ObsidResolveNoteForSchema<Schema> = (reference) => {
    const resolvedPath = resolveVaultPath(reference.path, currentPath, vaultPaths);

    if (!resolvedPath) {
      return Promise.resolve(null);
    }

    return getFile(resolvedPath);
  };
  function resolveFolder(
    reference: ObsidFolderReference,
  ): Promise<readonly ObsidVaultFile<Schema>[]>;
  function resolveFolder<PageType extends keyof Schema["registry"] & string>(
    reference: ObsidFolderReference,
    pageType: PageType,
  ): Promise<
    readonly Extract<
      ObsidVaultFile<Schema>,
      {
        readonly pageType: PageType;
      }
    >[]
  >;
  async function resolveFolder(
    reference: ObsidFolderReference,
    pageType?: keyof Schema["registry"] & string,
  ): Promise<readonly ObsidVaultFile<Schema>[]> {
    const folderPath = normalizeFolderPath(reference.vaultPath);

    if (folderPath === null) {
      return [];
    }

    const notes = await loadFolderFiles(vaultPaths, folderPath, getFile);

    if (pageType === undefined) {
      return notes;
    }

    return notes.filter((note) => note.pageType === pageType);
  }

  return {
    resolveFolder,
    resolveNote,
  };
};

// biome-ignore lint/complexity/useMaxParams: This test seam exposes the complete file identity plus its schema.
const getFileFromLoaders = async <Schema extends ObsidSchemaShape>(
  loaders: FileLoaders,
  vaultsFolder: string,
  vaultName: string,
  vaultPath: string,
  schema: Schema,
): Promise<ObsidVaultFile<Schema> | null> => {
  const vaultRoot = normalizeVaultsFolder(vaultsFolder);
  const normalizedVaultName = normalizeVaultName(vaultName);
  const normalizedPath = normalizePath(vaultPath);

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
  const getFile = (path: string) =>
    getFileFromLoaders(loaders, vaultsFolder, normalizedVaultName, path, schema);
  const { resolveFolder, resolveNote } = createFileResolvers(getFile, normalizedPath, vaultPaths);
  const currentFolder: ObsidFolderReference = {
    kind: "folder",
    vaultPath: getParentFolderPath(normalizedPath),
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
    resolveFolder,
    resolveNote,
    source,
    vaultPath: normalizedPath,
    webPath: getWebPath(schema, normalizedPath),
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

  const vaultPaths = getVaultPaths(loaders, vaultRoot, name);
  const getFile = (vaultPath: string) =>
    getFileFromLoaders(loaders, config.vaultsFolder, name, vaultPath, schema);

  return {
    getFile,
    getFolder: (path) => {
      const folderPath = normalizeFolderPath(path);

      if (folderPath === null) {
        return Promise.resolve([]);
      }

      return loadFolderFiles(vaultPaths, folderPath, getFile);
    },
    name,
    vaultPaths,
  };
};

export { getFileFromLoaders, getVaultFromLoaders };
