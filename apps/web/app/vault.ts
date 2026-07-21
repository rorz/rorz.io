import { getVault } from "obsid/vault";
import obsidConfig from "../obsid.config.ts";
import { createVaultRouteManifest } from "./vault-routing.ts";

const vault = getVault(obsidConfig, "rorz.io");
const vaultRouteManifest = createVaultRouteManifest(vault);

const getVaultRouteManifest = () => vaultRouteManifest;

export { getVaultRouteManifest, vault };
