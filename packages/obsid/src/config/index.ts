import { env, resolveSync } from "bun";
import { z } from "zod";

const ObsidConfigSchema = z.object({
  deviceName: z
    .string()
    .optional()
    .default(`obsid [env == ${env.NODE_ENV ?? "NONE"}]`),
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
  vaultsFolder: z.string().optional().default("./.obsidian-vaults/"),
});

type ObsidConfig = z.output<typeof ObsidConfigSchema>;
type ObsidConfigInput = z.input<typeof ObsidConfigSchema>;

const defineConfig = (config: ObsidConfigInput): ObsidConfig => ObsidConfigSchema.parse(config);

const resolveConfigModule = (configPath: string): string => {
  if (configPath.startsWith("/")) {
    return configPath;
  }

  let specifier = configPath;
  if (!specifier.startsWith(".")) {
    specifier = `./${specifier}`;
  }

  return resolveSync(specifier, ".");
};

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

export type { ObsidConfig, ObsidConfigInput };
export { defineConfig, loadConfig };
