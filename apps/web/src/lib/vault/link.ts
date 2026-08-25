import type { VaultLink } from "obsid/vault";
import { getVaultWebPath } from "@/lib/vault/routing.ts";

const getVaultLinkUrl = (link: VaultLink): string => {
  if (link.resolvedPath) {
    return getVaultWebPath(link.resolvedPath);
  }

  return `#unresolved-${encodeURIComponent(link.target)}`;
};

export { getVaultLinkUrl };
