import type {
  ObsidPageForSchema,
  ObsidResolveFolderForSchema,
  ObsidResolveNoteForSchema,
  ObsidSchemaShape,
} from "../config/schema.ts";
import type { ObsidFolderReference } from "../types/reference.ts";

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

type ObsidVaultFile<Schema extends ObsidSchemaShape> = VaultFile &
  ObsidPageForSchema<Schema> & {
    readonly currentFolder: ObsidFolderReference;
    readonly resolveFolder: ObsidResolveFolderForSchema<Schema>;
    readonly resolveNote: ObsidResolveNoteForSchema<Schema>;
  };

type VaultName<Config extends VaultConfig> = Config["vaults"][number]["name"];
type GetFile<File extends VaultFile = VaultFile> = (path: string) => Promise<File | null>;
type GetFolder<File extends VaultFile = VaultFile> = (path: string) => Promise<readonly File[]>;

interface Vault<Name extends string = string, File extends VaultFile = VaultFile> {
  readonly getFile: GetFile<File>;
  readonly getFolder: GetFolder<File>;
  readonly name: Name;
  readonly paths: readonly string[];
}

type ObsidVault<Schema extends ObsidSchemaShape, Name extends string = string> = Vault<
  Name,
  ObsidVaultFile<Schema>
>;

type GetVault = <const Config extends VaultConfig, const Schema extends ObsidSchemaShape>(
  config: Config,
  schema: Schema,
  name: NoInfer<VaultName<Config>>,
) => ObsidVault<Schema, VaultName<Config>>;

export type {
  GetFile,
  GetFolder,
  GetVault,
  ObsidVault,
  ObsidVaultFile,
  Vault,
  VaultConfig,
  VaultFile,
  VaultFrontmatter,
  VaultFrontmatterValue,
  VaultLink,
  VaultName,
};
