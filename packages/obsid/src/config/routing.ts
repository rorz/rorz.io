const apostrophePattern = /['’]/gu;
const combiningMarkPattern = /\p{Mark}+/gu;
const invalidWebPathPattern = /[?#\\]/u;
const nonWordPattern = /[^\p{Letter}\p{Number}]+/gu;
const surroundingHyphenPattern = /(?:^-+|-+$)/gu;

type ObsidSlugify = (value: string) => string;

interface ObsidPermalinkContext {
  readonly slugify: ObsidSlugify;
  readonly vaultPath: string;
}

type ObsidPermalink = (context: ObsidPermalinkContext) => string;

interface ObsidRouting {
  readonly permalink?: ObsidPermalink;
  readonly slugify?: ObsidSlugify;
}

interface ObsidRoutingSchema {
  readonly routing?: ObsidRouting;
}

const slugify = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(combiningMarkPattern, "")
    .replace(apostrophePattern, "")
    .toLowerCase()
    .replace(nonWordPattern, "-")
    .replace(surroundingHyphenPattern, "");

const defaultPermalink: ObsidPermalink = ({ slugify: createSlug, vaultPath }) => {
  if (!vaultPath) {
    return "/";
  }

  const segments = vaultPath.split("/").map((segment) => {
    const slug = createSlug(segment);

    if (!slug) {
      throw new Error(`Vault path segment in ${vaultPath}.md must produce a non-empty slug`);
    }

    return slug;
  });

  return `/${segments.join("/")}`;
};

const validateWebPath = (webPath: string, vaultPath: string): string => {
  if (
    !webPath.startsWith("/") ||
    webPath.startsWith("//") ||
    (webPath !== "/" && webPath.endsWith("/")) ||
    invalidWebPathPattern.test(webPath)
  ) {
    throw new Error(
      `Permalink for ${vaultPath}.md must return a root-relative web path without a trailing slash`,
    );
  }

  const segments = webPath.slice(1).split("/");

  if (
    webPath !== "/" &&
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    throw new Error(`Permalink for ${vaultPath}.md returned an invalid web path: ${webPath}`);
  }

  return webPath;
};

const getWebPath = (schema: ObsidRoutingSchema, vaultPath: string): string => {
  const createSlug = schema.routing?.slugify ?? slugify;
  const createPermalink = schema.routing?.permalink ?? defaultPermalink;

  return validateWebPath(
    createPermalink({
      slugify: createSlug,
      vaultPath,
    }),
    vaultPath,
  );
};

export type { ObsidPermalink, ObsidPermalinkContext, ObsidRouting, ObsidSlugify };
export { defaultPermalink, getWebPath, slugify };
