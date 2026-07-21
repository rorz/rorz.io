interface VaultConfig {
  readonly vaults: readonly {
    readonly name: string;
  }[];
  readonly vaultsFolder: string;
}

interface VaultLink {
  readonly label: string;
  readonly resolvedPath: string | null;
  readonly target: string;
  readonly type: "link";
}

type VaultFrontmatterValue =
  | boolean
  | null
  | number
  | string
  | VaultFrontmatter
  | VaultLink
  | readonly VaultFrontmatterValue[];

interface VaultFrontmatter {
  readonly [key: string]: VaultFrontmatterValue;
}

interface VaultFile {
  readonly body: string;
  readonly frontmatter: VaultFrontmatter;
  readonly links: readonly VaultLink[];
  readonly path: string;
  readonly source: string;
}

type VaultName<Config extends VaultConfig> = Config["vaults"][number]["name"];
type GetFile = (path: string) => Promise<VaultFile | null>;
type GetFolder = (path: string) => Promise<readonly VaultFile[]>;

interface Vault<Name extends string = string> {
  readonly getFile: GetFile;
  readonly getFolder: GetFolder;
  readonly name: Name;
  readonly paths: readonly string[];
}

type GetVault = <const Config extends VaultConfig>(
  config: Config,
  name: NoInfer<VaultName<Config>>,
) => Vault<VaultName<Config>>;

export type {
  GetFile,
  GetFolder,
  GetVault,
  Vault,
  VaultConfig,
  VaultFile,
  VaultFrontmatter,
  VaultFrontmatterValue,
  VaultLink,
  VaultName,
};
