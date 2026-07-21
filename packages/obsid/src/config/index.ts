import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { z } from "zod";

const DEFAULT_DEVICE_NAME = `obsid [env == ${process.env.NODE_ENV ?? "NONE"}]`;
const DEFAULT_VAULTS_FOLDER = "./.obsidian-vaults/";

const ObsidConfigSchema = z.object({
  deviceName: z.string().optional().default(DEFAULT_DEVICE_NAME),
  login: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
  vaults: z.array(
    z.object({
      encryptionPassword: z.string().min(1).optional(),
      name: z.string().min(1),
    }),
  ),
  vaultsFolder: z.string().optional().default(DEFAULT_VAULTS_FOLDER),
});

type ObsidConfig = z.output<typeof ObsidConfigSchema>;
type ObsidConfigInput = z.input<typeof ObsidConfigSchema>;
type ObsidVault = ObsidConfig["vaults"][number];
type DefinedObsidConfig<Input extends ObsidConfigInput> = Omit<ObsidConfig, "vaults"> & {
  vaults: Array<
    Omit<ObsidVault, "name"> & {
      name: Input["vaults"][number]["name"];
    }
  >;
};

const defineConfig = <const Input extends ObsidConfigInput>(
  config: Input,
): DefinedObsidConfig<Input> =>
  ({
    ...config,
    deviceName: config.deviceName ?? DEFAULT_DEVICE_NAME,
    vaultsFolder: config.vaultsFolder ?? DEFAULT_VAULTS_FOLDER,
  }) as DefinedObsidConfig<Input>;

const resolveConfigModule = (configPath: string): string => pathToFileURL(resolve(configPath)).href;

const loadConfig = async (configPath: string): Promise<ObsidConfig> => {
  if (!configPath.endsWith(".ts")) {
    throw new Error(`Config must be a TypeScript file: ${configPath}`);
  }

  const resolvedPath = resolveConfigModule(configPath);
  const configModule = (await import(resolvedPath)) as {
    default: unknown;
  };
  return ObsidConfigSchema.parse(configModule.default);
};

export type { DefinedObsidConfig, ObsidConfig, ObsidConfigInput };
export { defineConfig, loadConfig };
