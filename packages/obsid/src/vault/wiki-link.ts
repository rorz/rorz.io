import type { VaultFrontmatter, VaultFrontmatterValue, VaultLink } from "./types.ts";

interface WikiLinkMatch {
  readonly index: number;
  readonly label: string;
  readonly raw: string;
  readonly target: string;
}

interface CreateVaultLinksOptions {
  readonly body: string;
  readonly currentPath: string;
  readonly frontmatter: Readonly<Record<string, unknown>>;
  readonly vaultPaths: readonly string[];
}

const wikiLinkPattern = /(?<!!)\[\[([^\]\n]+)\]\]/gu;
const wikiEmbedPattern = /!\[\[([^\]\n]+)\]\]/gu;
const linkSubpathPattern = /[#^].*$/u;
const leadingCurrentDirectoryPattern = /^\.\/+/u;
const leadingSlashPattern = /^\/+/u;
const markdownExtensionPattern = /\.md$/iu;

const findWikiReferences = (value: string, pattern: RegExp): readonly WikiLinkMatch[] => {
  const links: WikiLinkMatch[] = [];

  for (const match of value.matchAll(pattern)) {
    const body = match[1] ?? "";
    const separator = body.indexOf("|");
    let target = body.trim();
    let label = target;

    if (separator !== -1) {
      target = body.slice(0, separator).trim();
      label = body.slice(separator + 1).trim() || target;
    }

    if (target) {
      links.push({
        index: match.index,
        label,
        raw: match[0],
        target,
      });
    }
  }

  return links;
};

const findWikiEmbeds = (value: string): readonly WikiLinkMatch[] =>
  findWikiReferences(value, wikiEmbedPattern);

const findWikiLinks = (value: string): readonly WikiLinkMatch[] =>
  findWikiReferences(value, wikiLinkPattern);

const collectWikiLinks = (
  value: unknown,
  matches: WikiLinkMatch[],
  visited: WeakSet<object>,
): void => {
  if (typeof value === "string") {
    matches.push(...findWikiLinks(value));
    return;
  }

  if (typeof value !== "object" || value === null || visited.has(value)) {
    return;
  }

  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      collectWikiLinks(item, matches, visited);
    }
    return;
  }

  for (const child of Object.values(value)) {
    collectWikiLinks(child, matches, visited);
  }
};

const normalizeTargetPath = (target: string): string | null => {
  const normalized = target
    .replaceAll("\\", "/")
    .replace(linkSubpathPattern, "")
    .replace(leadingCurrentDirectoryPattern, "")
    .replace(leadingSlashPattern, "")
    .replace(markdownExtensionPattern, "");
  const segments = normalized.split("/");

  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    return null;
  }

  return normalized;
};

const resolveVaultPath = (
  target: string,
  currentPath: string,
  vaultPaths: readonly string[],
): string | null => {
  const normalizedTarget = normalizeTargetPath(target);

  if (normalizedTarget === null) {
    if (target.startsWith("#") || target.startsWith("^")) {
      return currentPath;
    }

    return null;
  }

  const exactPath = vaultPaths.find(
    (vaultPath) => vaultPath.toLowerCase() === normalizedTarget.toLowerCase(),
  );

  if (exactPath) {
    return exactPath;
  }

  if (normalizedTarget.includes("/")) {
    return null;
  }

  const matchingPaths = vaultPaths.filter((vaultPath) => {
    const basename = vaultPath.slice(vaultPath.lastIndexOf("/") + 1);
    return basename.toLowerCase() === normalizedTarget.toLowerCase();
  });

  if (matchingPaths.length !== 1) {
    return null;
  }

  return matchingPaths[0] ?? null;
};

const createVaultLink = (
  match: WikiLinkMatch,
  currentPath: string,
  vaultPaths: readonly string[],
): VaultLink => ({
  label: match.label,
  resolvedPath: resolveVaultPath(match.target, currentPath, vaultPaths),
  target: match.target,
  type: "link",
});

const findStandaloneWikiLink = (value: string): WikiLinkMatch | null => {
  const candidate = value.trim();
  const matches = findWikiLinks(candidate);
  const [match] = matches;

  if (
    !(match && matches.length === 1 && match.index === 0 && match.raw.length === candidate.length)
  ) {
    return null;
  }

  return match;
};

const resolveFrontmatterValue = (
  value: unknown,
  currentPath: string,
  vaultPaths: readonly string[],
  resolvedValues: WeakMap<object, VaultFrontmatterValue>,
): VaultFrontmatterValue => {
  if (typeof value === "string") {
    const match = findStandaloneWikiLink(value);

    if (match) {
      return createVaultLink(match, currentPath, vaultPaths);
    }

    return value;
  }

  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (typeof value !== "object") {
    throw new TypeError(`Unsupported frontmatter value: ${typeof value}`);
  }

  const existingValue = resolvedValues.get(value);

  if (existingValue) {
    return existingValue;
  }

  if (Array.isArray(value)) {
    const resolvedItems: VaultFrontmatterValue[] = [];
    resolvedValues.set(value, resolvedItems);

    for (const item of value) {
      resolvedItems.push(resolveFrontmatterValue(item, currentPath, vaultPaths, resolvedValues));
    }

    return resolvedItems;
  }

  const resolvedObject: Record<string, VaultFrontmatterValue> = {};
  resolvedValues.set(value, resolvedObject);

  for (const [key, child] of Object.entries(value)) {
    resolvedObject[key] = resolveFrontmatterValue(child, currentPath, vaultPaths, resolvedValues);
  }

  return resolvedObject;
};

const resolveFrontmatterLinks = ({
  currentPath,
  frontmatter,
  vaultPaths,
}: Omit<CreateVaultLinksOptions, "body">): VaultFrontmatter => {
  const resolvedFrontmatter: Record<string, VaultFrontmatterValue> = {};
  const resolvedValues = new WeakMap<object, VaultFrontmatterValue>();
  resolvedValues.set(frontmatter, resolvedFrontmatter);

  for (const [key, value] of Object.entries(frontmatter)) {
    resolvedFrontmatter[key] = resolveFrontmatterValue(
      value,
      currentPath,
      vaultPaths,
      resolvedValues,
    );
  }

  return resolvedFrontmatter;
};

const isVaultLink = (value: unknown): value is VaultLink => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<VaultLink>;

  return (
    candidate.type === "link" &&
    typeof candidate.label === "string" &&
    typeof candidate.target === "string" &&
    (candidate.resolvedPath === null || typeof candidate.resolvedPath === "string")
  );
};

const createVaultLinks = ({
  body,
  currentPath,
  frontmatter,
  vaultPaths,
}: CreateVaultLinksOptions): readonly VaultLink[] => {
  const matches: WikiLinkMatch[] = [];
  collectWikiLinks(frontmatter, matches, new WeakSet());
  matches.push(...findWikiLinks(body));

  const uniqueMatches = new Map<string, WikiLinkMatch>();

  for (const match of matches) {
    uniqueMatches.set(match.target.toLowerCase(), match);
  }

  return Array.from(uniqueMatches.values(), (match) =>
    createVaultLink(match, currentPath, vaultPaths),
  );
};

export {
  createVaultLinks,
  findWikiEmbeds,
  findWikiLinks,
  isVaultLink,
  resolveFrontmatterLinks,
  resolveVaultPath,
};
