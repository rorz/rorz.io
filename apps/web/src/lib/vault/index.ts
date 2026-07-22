import { getVault } from "obsid/vault";
import { createVaultRouteManifest } from "@/lib/vault/routing.ts";
import obsidConfig from "../../../obsid.config.ts";

const vault = getVault(obsidConfig, "rorz.io");
const vaultRouteManifest = createVaultRouteManifest(vault);

const getVaultRouteManifest = () => vaultRouteManifest;

export { getVaultRouteManifest, vault };
