const leadingCurrentDirectoryPattern = /^\.\/+/u;
const leadingSlashPattern = /^\/+/u;
const trailingSlashPattern = /\/+$/u;

const normalizeVaultsFolder = (vaultsFolder: string): string | null => {
  const normalized = vaultsFolder
    .replaceAll("\\", "/")
    .replace(leadingCurrentDirectoryPattern, "")
    .replace(leadingSlashPattern, "")
    .replace(trailingSlashPattern, "");
  const segments = normalized.split("/");

  if (
    normalized.length === 0 ||
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    return null;
  }

  return `/${normalized}`;
};

export { normalizeVaultsFolder };
