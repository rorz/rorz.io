import { createObsidianFile, type ObsidianFile } from "./markdown.tsx";

type FileLoader = () => Promise<string>;
type FileLoaders = Readonly<Record<string, FileLoader>>;
type GetFile = (path: string) => Promise<ObsidianFile | null>;

const leadingSlashPattern = /^\/+/u;
const markdownExtensionPattern = /\.md$/iu;

const normalizePath = (path: string): string | null => {
  const normalized = path
    .replaceAll("\\", "/")
    .replace(leadingSlashPattern, "")
    .replace(markdownExtensionPattern, "");
  const segments = normalized.split("/");

  if (
    normalized.length === 0 ||
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    return null;
  }

  return normalized;
};

const createGetFile =
  (loaders: FileLoaders, sourceRoot: string): GetFile =>
  async (path) => {
    const normalized = normalizePath(path);

    if (!normalized) {
      return null;
    }

    const load = loaders[`${sourceRoot}${normalized}.md`];

    if (!load) {
      return null;
    }

    return createObsidianFile(normalized, await load());
  };

export type { FileLoader, FileLoaders, GetFile };
export { createGetFile };
