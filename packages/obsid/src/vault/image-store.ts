import type { ObsidResolveImage } from "../config/schema.ts";
import { normalizeVaultsFolder } from "./vault-path.ts";
import { resolveVaultPath } from "./wiki-link.ts";

type ImageUrls = Readonly<Record<string, string>>;

const getVaultImagePaths = (
  imageUrls: ImageUrls,
  vaultRoot: string,
  vaultName: string,
): readonly string[] => {
  const prefix = `${vaultRoot}/${vaultName}/`;

  return Object.keys(imageUrls)
    .filter((path) => path.startsWith(prefix))
    .map((path) => path.slice(prefix.length))
    .toSorted();
};

const createResolveImage = (
  imageUrls: ImageUrls,
  vaultsFolder: string,
  vaultName: string,
  currentPath: string,
): ObsidResolveImage => {
  const vaultRoot = normalizeVaultsFolder(vaultsFolder);

  if (!vaultRoot) {
    return () => null;
  }

  const imagePaths = getVaultImagePaths(imageUrls, vaultRoot, vaultName);

  return (target) => {
    const resolvedPath = resolveVaultPath(target, currentPath, imagePaths);

    if (!resolvedPath) {
      return null;
    }

    return imageUrls[`${vaultRoot}/${vaultName}/${resolvedPath}`] ?? null;
  };
};

export type { ImageUrls };
export { createResolveImage };
