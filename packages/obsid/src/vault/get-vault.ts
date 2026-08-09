/// <reference path="./vault-files.d.ts" />

import { vaultFiles, vaultImages } from "virtual:obsid/vault-files";
import { getVaultFromSources } from "./file-store.ts";
import type { GetVault } from "./types.ts";

const getVault: GetVault = (config, schema, name) =>
  getVaultFromSources(
    {
      imageUrls: vaultImages,
      loaders: vaultFiles,
    },
    config,
    schema,
    name,
  );

export { getVault };
