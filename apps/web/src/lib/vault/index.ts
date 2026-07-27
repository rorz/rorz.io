import { getVault } from "obsid/vault";
import { createVaultRouteManifest } from "@/lib/vault/routing.ts";
import obsidConfig from "../../../obsid.config.ts";
import schema from "./schema.tsx";

const vault = getVault(obsidConfig, schema, "rorz.io");
let vaultRouteManifest: ReturnType<typeof createVaultRouteManifest> | undefined;

const getVaultRouteManifest = () => {
  vaultRouteManifest ??= createVaultRouteManifest(vault);
  return vaultRouteManifest;
};

export { getVaultRouteManifest, vault };
