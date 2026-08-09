import { getWebPath } from "../config/routing.ts";
import type { ObsidSchemaShape } from "../config/schema.ts";
import type { ObsidFolderReference } from "../types/reference.ts";
import { parseVaultSource } from "./frontmatter.ts";
import { createResolveImage, type ImageUrls } from "./image-store.ts";
import { createQuery, loadFolderFiles, normalizeFolderPath } from "./query.ts";
import type { ObsidVault, ObsidVaultFile, VaultConfig, VaultName } from "./types.ts";
import { normalizeVaultsFolder } from "./vault-path.ts";
import { createVaultLinks, resolveFrontmatterLinks } from "./wiki-link.ts";

type FileLoader = () => Promise<string>;
type FileLoaders = Readonly<Record<string, FileLoader>>;
interface VaultSources {
  readonly imageUrls: ImageUrls;
  readonly loaders: FileLoaders;
}

const leadingSlashPattern = /^\/+/u;
const markdownExtension = ".md";
const markdownExtensionPattern = /\.md$/iu;

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

// biome-ignore lint/complexity/useMaxParams: This test seam exposes the complete file identity plus its schema.
const getFileFromLoaders = async <Schema extends ObsidSchemaShape>(
  loaders: FileLoaders,
  vaultsFolder: string,
  vaultName: string,
  vaultPath: string,
  schema: Schema,
  imageUrls: ImageUrls = {},
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
    getFileFromLoaders(loaders, vaultsFolder, normalizedVaultName, path, schema, imageUrls);
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
    resolveImage: createResolveImage(imageUrls, vaultsFolder, normalizedVaultName, normalizedPath),
    source,
    vaultPath: normalizedPath,
    webPath: getWebPath(schema, normalizedPath),
  };
};

const getVaultFromSources = <
  const Config extends VaultConfig,
  const Schema extends ObsidSchemaShape,
>(
  sources: VaultSources,
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

  const vaultPaths = getVaultPaths(sources.loaders, vaultRoot, name);
  const getFile = (vaultPath: string) =>
    getFileFromLoaders(
      sources.loaders,
      config.vaultsFolder,
      name,
      vaultPath,
      schema,
      sources.imageUrls,
    );

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

const getVaultFromLoaders = <
  const Config extends VaultConfig,
  const Schema extends ObsidSchemaShape,
>(
  loaders: FileLoaders,
  config: Config,
  schema: Schema,
  name: NoInfer<VaultName<Config>>,
): ObsidVault<Schema, VaultName<Config>> =>
  getVaultFromSources(
    {
      imageUrls: {},
      loaders,
    },
    config,
    schema,
    name,
  );

export { getFileFromLoaders, getVaultFromLoaders, getVaultFromSources };
