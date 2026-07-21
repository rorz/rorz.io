import { resolve } from "node:path";
import type { ObsidConfig } from "../config/index.ts";
import { logIn, syncConfig, syncSetup, syncVault } from "./obsidian-headless.ts";

const sync = async (config: ObsidConfig) => {
  await logIn(config.login);

  for (const vault of config.vaults) {
    const path = resolve(config.vaultsFolder, vault.name);

    await syncSetup({
      deviceName: config.deviceName,
      encryptionPassword: vault.encryptionPassword,
      path,
      vault: vault.name,
    });
    await syncConfig({
      path,
    });
    await syncVault({
      path,
    });
  }
};

export { sync };
