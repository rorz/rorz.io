import { ObsidianMarkdown } from "obsid/react";
import { getVault, type VaultLink } from "obsid/vault";
import obsidConfig from "../obsid.config.ts";

interface PageProps {
  readonly searchParams: Promise<{
    readonly article?: string | string[];
  }>;
}

interface ResolvedLinkProps {
  readonly link: VaultLink;
}

const examplePath = "lists/best/New York-style pizza (whole)";

const getArticleHref = (link: VaultLink): string => {
  if (!link.resolvedPath) {
    return `#unresolved-${encodeURIComponent(link.target)}`;
  }

  return `/?article=${encodeURIComponent(link.resolvedPath)}`;
};

const ResolvedLink = ({ link }: ResolvedLinkProps) => {
  if (!link.resolvedPath) {
    return (
      <li className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950">
        <strong>{link.label}</strong>
        <span className="ml-2 text-sm">Unresolved</span>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
      <a className="font-medium text-emerald-950 underline" href={getArticleHref(link)}>
        {link.label}
      </a>
      <code className="mt-1 block text-xs text-emerald-800">{link.resolvedPath}</code>
    </li>
  );
};

const Page = async ({ searchParams }: PageProps) => {
  const requestedArticle = (await searchParams).article;
  let articlePath = examplePath;

  if (typeof requestedArticle === "string") {
    articlePath = requestedArticle;
  }

  const vault = getVault(obsidConfig, "rorz.io");
  const file = await vault.getFile(articlePath);

  if (!file) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold">Article not found</h1>
        <a className="mt-4 inline-block underline" href="/">
          Open the example
        </a>
      </main>
    );
  }

  const title = file.path.slice(file.path.lastIndexOf("/") + 1);

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl gap-10 p-6 md:grid-cols-[minmax(0,1fr)_22rem]">
      <article>
        <a
          className="text-sm text-neutral-500 underline"
          href={`/?article=${encodeURIComponent(examplePath)}`}
        >
          Open the frontmatter example
        </a>
        <p className="mt-10 font-mono text-xs text-neutral-500">{file.path}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-8 text-lg leading-8 text-neutral-800">
          <ObsidianMarkdown file={file} resolveWikiLink={getArticleHref} />
        </div>
      </article>

      <aside className="space-y-8 rounded-3xl bg-neutral-950 p-6 text-neutral-100 md:sticky md:top-8 md:self-start">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Frontmatter
          </h2>
          <pre className="mt-3 overflow-x-auto text-sm text-neutral-200">
            {JSON.stringify(file.frontmatter, null, 2)}
          </pre>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Article links
          </h2>
          <ul className="mt-3 space-y-2 text-neutral-950">
            {file.links.map((link) => (
              <ResolvedLink key={link.target} link={link} />
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
};

export default Page;
