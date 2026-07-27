/// <reference path="./vault-files.d.ts" />

import { vaultFiles } from "virtual:obsid/vault-files";
import { getVaultFromLoaders } from "./file-store.ts";
import type { GetVault } from "./types.ts";

const getVault: GetVault = (config, schema, name) =>
  getVaultFromLoaders(vaultFiles, config, schema, name);

export { getVault };
