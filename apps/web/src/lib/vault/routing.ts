import type { Vault } from "obsid/vault";

interface VaultRoute {
  readonly href: string;
  readonly routePath: string;
  readonly segments: readonly string[];
  readonly sourcePath: string;
}

interface VaultRouteManifest {
  readonly getBySegments: (segments?: readonly string[]) => VaultRoute | null;
  readonly getHref: (sourcePath: string) => string | null;
  readonly routes: readonly VaultRoute[];
}

const apostrophePattern = /['’]/gu;
const combiningMarkPattern = /\p{Mark}+/gu;
const nonWordPattern = /[^\p{Letter}\p{Number}]+/gu;
const surroundingHyphenPattern = /(?:^-+|-+$)/gu;

const slugifySegment = (segment: string): string =>
  segment
    .normalize("NFKD")
    .replace(combiningMarkPattern, "")
    .replace(apostrophePattern, "")
    .toLowerCase()
    .replace(nonWordPattern, "-")
    .replace(surroundingHyphenPattern, "");

const isDirectoryPage = (sourceSegments: readonly string[]): boolean => {
  const filename = sourceSegments.at(-1)?.toLowerCase();

  if (filename === "page") {
    return true;
  }

  const parentDirectory = sourceSegments.at(-2)?.toLowerCase();
  return parentDirectory !== undefined && filename === `page--${parentDirectory}`;
};

const getHref = (segments: readonly string[]): string => {
  if (segments.length === 0) {
    return "/";
  }

  return `/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
};

const createVaultRoute = (sourcePath: string): VaultRoute => {
  const sourceSegments = sourcePath.split("/");
  let routeSourceSegments = sourceSegments;

  if (isDirectoryPage(sourceSegments)) {
    routeSourceSegments = sourceSegments.slice(0, -1);
  }

  const segments = routeSourceSegments.map((segment) => {
    const slug = slugifySegment(segment);

    if (!slug) {
      throw new Error(`Path segment in ${sourcePath}.md must contain a letter or number`);
    }

    return slug;
  });
  const routePath = segments.join("/");

  return {
    href: getHref(segments),
    routePath,
    segments,
    sourcePath,
  };
};

const compareRoutes = (left: VaultRoute, right: VaultRoute): number => {
  if (left.routePath < right.routePath) {
    return -1;
  }

  if (left.routePath > right.routePath) {
    return 1;
  }

  return 0;
};

const createVaultRouteManifest = (vault: Pick<Vault, "paths">): VaultRouteManifest => {
  const routes = vault.paths.map(createVaultRoute).toSorted(compareRoutes);
  const routesByPath = new Map<string, VaultRoute>();
  const routesBySourcePath = new Map<string, VaultRoute>();

  for (const route of routes) {
    const existingRoute = routesByPath.get(route.routePath);

    if (existingRoute) {
      throw new Error(
        `Vault route collision at ${route.href}: ${existingRoute.sourcePath}.md and ${route.sourcePath}.md`,
      );
    }

    routesByPath.set(route.routePath, route);
    routesBySourcePath.set(route.sourcePath, route);
  }

  return {
    getBySegments: (segments = []) => routesByPath.get(segments.join("/")) ?? null,
    getHref: (sourcePath) => routesBySourcePath.get(sourcePath)?.href ?? null,
    routes,
  };
};

export { createVaultRouteManifest, slugifySegment };
