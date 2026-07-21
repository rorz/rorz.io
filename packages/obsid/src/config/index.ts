import process from "node:process";
import { z } from "zod";

const ObsidConfigSchema = z.object({
  deviceName: z
    .string()
    .optional()
    .default(`obsid [env == ${process.env.NODE_ENV ?? "NONE"}]`),
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

export type ObsidConfig = z.infer<typeof ObsidConfigSchema>;

export const loadConfig = async (path: string): Promise<ObsidConfig> => {
  const file = Bun.file(path);
  const contents = await file.json();

  return ObsidConfigSchema.parse(contents);
};
