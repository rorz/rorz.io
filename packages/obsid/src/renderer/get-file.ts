import { type GetFile, getFileFromLoaders } from "./file-store.ts";

const vaultFiles = import.meta.glob<string>("/.obsidian-vaults/**/*.md", {
  import: "default",
  query: "?raw",
});

const getFile: GetFile = (vaultName, path) => getFileFromLoaders(vaultFiles, vaultName, path);

export { getFile };
