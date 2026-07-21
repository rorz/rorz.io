import { parseVaultSource } from "./frontmatter.ts";
import type { Vault, VaultConfig, VaultFile, VaultName } from "./types.ts";
import { normalizeVaultsFolder } from "./vault-path.ts";
import { createVaultLinks, resolveFrontmatterLinks } from "./wiki-link.ts";

type FileLoader = () => Promise<string>;
type FileLoaders = Readonly<Record<string, FileLoader>>;

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

const getFileFromLoaders = async (
  loaders: FileLoaders,
  vaultsFolder: string,
  vaultName: string,
  path: string,
): Promise<VaultFile | null> => {
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
  const { body, frontmatter: rawFrontmatter } = parseVaultSource(source, normalizedPath);
  const vaultPaths = getVaultPaths(loaders, vaultRoot, normalizedVaultName);

  return {
    body,
    frontmatter: resolveFrontmatterLinks({
      currentPath: normalizedPath,
      frontmatter: rawFrontmatter,
      vaultPaths,
    }),
    links: createVaultLinks({
      body,
      currentPath: normalizedPath,
      frontmatter: rawFrontmatter,
      vaultPaths,
    }),
    path: normalizedPath,
    source,
  };
};

const getVaultFromLoaders = <const Config extends VaultConfig>(
  loaders: FileLoaders,
  config: Config,
  name: NoInfer<VaultName<Config>>,
): Vault<VaultName<Config>> => {
  if (!config.vaults.some((vault) => vault.name === name)) {
    throw new Error(`Unknown vault: ${name}`);
  }

  const vaultRoot = normalizeVaultsFolder(config.vaultsFolder);

  if (!vaultRoot) {
    throw new Error(`Invalid vaults folder: ${config.vaultsFolder}`);
  }

  return {
    getFile: (path) => getFileFromLoaders(loaders, config.vaultsFolder, name, path),
    name,
    paths: getVaultPaths(loaders, vaultRoot, name),
  };
};

export { getFileFromLoaders, getVaultFromLoaders };
