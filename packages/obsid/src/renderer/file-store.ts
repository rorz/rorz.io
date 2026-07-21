import { createObsidianFile, type ObsidianFile } from "./markdown.tsx";
import { normalizeVaultsFolder } from "./vault-path.ts";

type FileLoader = () => Promise<string>;
type FileLoaders = Readonly<Record<string, FileLoader>>;
interface ObsidRendererConfig {
  readonly vaults: readonly {
    readonly name: string;
  }[];
  readonly vaultsFolder: string;
}
type VaultName<Config extends ObsidRendererConfig> = Config["vaults"][number]["name"];
type GetFile = (path: string) => Promise<ObsidianFile | null>;
interface Vault<Name extends string = string> {
  readonly getFile: GetFile;
  readonly name: Name;
}
type GetVault = <const Config extends ObsidRendererConfig>(
  config: Config,
  name: NoInfer<VaultName<Config>>,
) => Vault<VaultName<Config>>;

const leadingSlashPattern = /^\/+/u;
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

const getFileFromLoaders = async (
  loaders: FileLoaders,
  vaultsFolder: string,
  vaultName: string,
  path: string,
): Promise<ObsidianFile | null> => {
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

  return createObsidianFile(normalizedPath, await load());
};

const getVaultFromLoaders = <const Config extends ObsidRendererConfig>(
  loaders: FileLoaders,
  config: Config,
  name: NoInfer<VaultName<Config>>,
): Vault<VaultName<Config>> => {
  if (!config.vaults.some((vault) => vault.name === name)) {
    throw new Error(`Unknown vault: ${name}`);
  }

  return {
    getFile: (path) => getFileFromLoaders(loaders, config.vaultsFolder, name, path),
    name,
  };
};

export type { GetFile, GetVault, ObsidRendererConfig, Vault, VaultName };
export { getFileFromLoaders, getVaultFromLoaders };
