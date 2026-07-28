import {
  defaultPermalink,
  getWebPath as getSchemaWebPath,
  type ObsidPermalink,
  type ObsidSchemaShape,
} from "obsid/schema";
import type { Vault } from "obsid/vault";

interface VaultRoute {
  readonly segments: readonly string[];
  readonly vaultPath: string;
  readonly webPath: string;
}

interface VaultRouteManifest {
  readonly getBySegments: (segments?: readonly string[]) => VaultRoute | null;
  readonly getWebPath: (vaultPath: string) => string | null;
  readonly routes: readonly VaultRoute[];
}

const isDirectoryPage = (vaultSegments: readonly string[]): boolean => {
  const filename = vaultSegments.at(-1)?.toLowerCase();

  if (filename === "page") {
    return true;
  }

  const parentDirectory = vaultSegments.at(-2)?.toLowerCase();
  return parentDirectory !== undefined && filename === `page--${parentDirectory}`;
};

const webPermalink: ObsidPermalink = (context) => {
  const vaultSegments = context.vaultPath.split("/");

  if (isDirectoryPage(vaultSegments)) {
    vaultSegments.pop();
  }

  return defaultPermalink({
    ...context,
    vaultPath: vaultSegments.join("/"),
  });
};

const getSegments = (webPath: string): readonly string[] => {
  if (webPath === "/") {
    return [];
  }

  return webPath.slice(1).split("/");
};

const getWebPathFromSegments = (segments: readonly string[]): string => {
  if (segments.length === 0) {
    return "/";
  }

  return `/${segments.join("/")}`;
};

const createVaultRoute = (vaultPath: string, schema: ObsidSchemaShape): VaultRoute => {
  const webPath = getSchemaWebPath(schema, vaultPath);

  return {
    segments: getSegments(webPath),
    vaultPath,
    webPath,
  };
};

const compareRoutes = (left: VaultRoute, right: VaultRoute): number =>
  left.webPath.localeCompare(right.webPath);

const createVaultRouteManifest = (
  vault: Pick<Vault, "vaultPaths">,
  schema: ObsidSchemaShape,
): VaultRouteManifest => {
  const routes = vault.vaultPaths
    .map((vaultPath) => createVaultRoute(vaultPath, schema))
    .toSorted(compareRoutes);
  const routesByVaultPath = new Map<string, VaultRoute>();
  const routesByWebPath = new Map<string, VaultRoute>();

  for (const route of routes) {
    const existingRoute = routesByWebPath.get(route.webPath);

    if (existingRoute) {
      throw new Error(
        `Vault route collision at ${route.webPath}: ${existingRoute.vaultPath}.md and ${route.vaultPath}.md`,
      );
    }

    routesByVaultPath.set(route.vaultPath, route);
    routesByWebPath.set(route.webPath, route);
  }

  return {
    getBySegments: (segments = []) => routesByWebPath.get(getWebPathFromSegments(segments)) ?? null,
    getWebPath: (vaultPath) => routesByVaultPath.get(vaultPath)?.webPath ?? null,
    routes,
  };
};

export { createVaultRouteManifest, webPermalink };
