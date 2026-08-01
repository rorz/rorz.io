import { getWebPath } from "../config/routing.ts";
import type {
  DefinitionsForSchema,
  ObsidFindManyOptions,
  ObsidQueryForSchema,
  ObsidResolvedNoteForSchema,
  ObsidSchemaShape,
} from "../config/schema.ts";
import { compareOrderExpressions } from "../config/sort.ts";
import type { ObsidianNotePropertyValue } from "../types/frontmatter.ts";
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

const createQuery = <Schema extends ObsidSchemaShape>(
  getFile: VaultFileLoader<Schema>,
  currentPath: string,
  vaultPaths: readonly string[],
): ObsidQueryForSchema<Schema> => {
  const resolve = async (
    reference: ObsidianNotePropertyValue,
  ): Promise<ObsidVaultFile<Schema> | null> => {
    const resolvedPath = resolveVaultPath(reference.path, currentPath, vaultPaths);

    if (!resolvedPath) {
      return null;
    }

    const resolved = await getFile(resolvedPath);

    if (!resolved) {
      return null;
    }

    return resolved;
  };

  const resolveOrThrow = async (
    reference: ObsidianNotePropertyValue,
  ): Promise<ObsidVaultFile<Schema>> => {
    const resolved = await resolve(reference);

    if (!resolved) {
      throw new Error(`Could not resolve note reference "${reference.path}"`);
    }

    return resolved;
  };

  const findMany = async (
    options: ObsidFindManyOptions<DefinitionsForSchema<Schema>, ObsidResolvedNoteForSchema<Schema>>,
  ): Promise<readonly ObsidVaultFile<Schema>[]> => {
    const folderPath = normalizeFolderPath(options.folder.vaultPath);

    if (folderPath === null) {
      return [];
    }

    let notes = await loadFolderFiles(vaultPaths, folderPath, getFile);

    if (options.kind !== undefined) {
      notes = notes.filter((note) => note.kind === options.kind);
    }

    if (options.orderBy) {
      const { orderBy } = options;
      notes = notes.toSorted((left, right) =>
        compareOrderExpressions(orderBy(left), orderBy(right)),
      );
    }

    if (options.limit !== undefined) {
      if (!(Number.isSafeInteger(options.limit) && options.limit >= 0)) {
        throw new RangeError("Query limit must be a non-negative integer");
      }

      notes = notes.slice(0, options.limit);
    }

    return notes;
  };

  return {
    findMany,
    resolve,
    resolveOrThrow,
  } as ObsidQueryForSchema<Schema>;
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
  const query = createQuery(getFile, normalizedPath, vaultPaths);
  const folder: ObsidFolderReference = {
    kind: "folder",
    vaultPath: getParentFolderPath(normalizedPath),
  };
  const name = normalizedPath.slice(normalizedPath.lastIndexOf("/") + 1);

  return {
    ...parsedSource,
    folder,
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
    name,
    query,
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
