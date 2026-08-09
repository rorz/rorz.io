import type {
  DefinitionsForSchema,
  ObsidFindManyOptions,
  ObsidQueryForSchema,
  ObsidResolvedNoteForSchema,
  ObsidSchemaShape,
} from "../config/schema.ts";
import { compareOrderExpressions } from "../config/sort.ts";
import type { ObsidianNotePropertyValue } from "../types/frontmatter.ts";
import type { ObsidVaultFile } from "./types.ts";
import { resolveVaultPath } from "./wiki-link.ts";

type VaultFileLoader<Schema extends ObsidSchemaShape> = (
  vaultPath: string,
) => Promise<ObsidVaultFile<Schema> | null>;

const leadingSlashPattern = /^\/+/u;
const trailingSlashPattern = /\/+$/u;

const normalizeFolderPath = (path: string): string | null => {
  const normalized = path
    .replaceAll("\\", "/")
    .replace(leadingSlashPattern, "")
    .replace(trailingSlashPattern, "");

  if (normalized.length === 0) {
    return "";
  }

  const segments = normalized.split("/");

  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    return null;
  }

  return normalized;
};

const getFolderPaths = (vaultPaths: readonly string[], folderPath: string): readonly string[] => {
  const prefix = folderPath ? `${folderPath}/` : "";

  return vaultPaths.filter(
    (path) => path.startsWith(prefix) && !path.slice(prefix.length).includes("/"),
  );
};

const loadFolderFiles = async <Schema extends ObsidSchemaShape>(
  vaultPaths: readonly string[],
  folderPath: string,
  getFile: VaultFileLoader<Schema>,
): Promise<readonly ObsidVaultFile<Schema>[]> => {
  const files = (await Promise.all(
    getFolderPaths(vaultPaths, folderPath).map((filePath) => getFile(filePath)),
  )) as Array<ObsidVaultFile<Schema> | null>;

  return files.filter((file): file is ObsidVaultFile<Schema> => file !== null);
};

const createFindMany =
  <Schema extends ObsidSchemaShape>(
    getFile: VaultFileLoader<Schema>,
    vaultPaths: readonly string[],
  ) =>
  async (
    options: ObsidFindManyOptions<DefinitionsForSchema<Schema>, ObsidResolvedNoteForSchema<Schema>>,
  ): Promise<readonly ObsidVaultFile<Schema>[]> => {
    const folderPath = normalizeFolderPath(options.folder.vaultPath);

    if (folderPath === null) {
      return [];
    }

    let notes = await loadFolderFiles(vaultPaths, folderPath, getFile);

    if (options.kind !== undefined) {
      notes = notes.filter((note) => note.kind === options.kind);
    }

    if (options.orderBy) {
      const { orderBy } = options;
      notes = notes.toSorted((left, right) =>
        compareOrderExpressions(orderBy(left), orderBy(right)),
      );
    }

    if (options.limit !== undefined) {
      if (!(Number.isSafeInteger(options.limit) && options.limit >= 0)) {
        throw new RangeError("Query limit must be a non-negative integer");
      }

      notes = notes.slice(0, options.limit);
    }

    return notes;
  };

const createQuery = <Schema extends ObsidSchemaShape>(
  getFile: VaultFileLoader<Schema>,
  currentPath: string,
  vaultPaths: readonly string[],
): ObsidQueryForSchema<Schema> => {
  const resolve = (
    reference: ObsidianNotePropertyValue,
  ): Promise<ObsidVaultFile<Schema> | null> => {
    const resolvedPath = resolveVaultPath(reference.path, currentPath, vaultPaths);

    if (!resolvedPath) {
      return Promise.resolve(null);
    }

    return getFile(resolvedPath);
  };
  const resolveOrThrow = async (
    reference: ObsidianNotePropertyValue,
  ): Promise<ObsidVaultFile<Schema>> => {
    const resolved = await resolve(reference);

    if (!resolved) {
      throw new Error(`Could not resolve note reference "${reference.path}"`);
    }

    return resolved;
  };

  return {
    findMany: createFindMany(getFile, vaultPaths),
    resolve,
    resolveOrThrow,
  } as ObsidQueryForSchema<Schema>;
};

export { createQuery, loadFolderFiles, normalizeFolderPath };
