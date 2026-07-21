import type { VaultFrontmatter, VaultLink } from "./types.ts";

interface WikiLinkMatch {
  readonly index: number;
  readonly label: string;
  readonly raw: string;
  readonly target: string;
}

interface CreateVaultLinksOptions {
  readonly body: string;
  readonly currentPath: string;
  readonly frontmatter: VaultFrontmatter;
  readonly vaultPaths: readonly string[];
}

const wikiLinkPattern = /(?<!!)\[\[([^\]\n]+)\]\]/gu;
const linkSubpathPattern = /[#^].*$/u;
const leadingCurrentDirectoryPattern = /^\.\/+/u;
const leadingSlashPattern = /^\/+/u;
const markdownExtensionPattern = /\.md$/iu;

const findWikiLinks = (value: string): readonly WikiLinkMatch[] => {
  const links: WikiLinkMatch[] = [];

  for (const match of value.matchAll(wikiLinkPattern)) {
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

const collectFrontmatterLinks = (
  value: unknown,
  targets: string[],
  visited: WeakSet<object>,
): void => {
  if (typeof value === "string") {
    targets.push(...findWikiLinks(value).map((link) => link.target));
    return;
  }

  if (typeof value !== "object" || value === null || visited.has(value)) {
    return;
  }

  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      collectFrontmatterLinks(item, targets, visited);
    }
    return;
  }

  for (const child of Object.values(value)) {
    collectFrontmatterLinks(child, targets, visited);
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

const createVaultLinks = ({
  body,
  currentPath,
  frontmatter,
  vaultPaths,
}: CreateVaultLinksOptions): readonly VaultLink[] => {
  const targets: string[] = [];
  collectFrontmatterLinks(frontmatter, targets, new WeakSet());
  targets.push(...findWikiLinks(body).map((link) => link.target));

  const uniqueTargets = new Map<string, string>();

  for (const target of targets) {
    uniqueTargets.set(target.toLowerCase(), target);
  }

  return Array.from(uniqueTargets.values(), (target) => ({
    resolvedPath: resolveVaultPath(target, currentPath, vaultPaths),
    target,
  }));
};

export { createVaultLinks, findWikiLinks };
