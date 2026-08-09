import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ObsidianMarkdown } from "./markdown.tsx";
import type { ResolveWikiImage, ResolveWikiLink } from "./types.ts";

test("renders a vault body and resolves its structured wiki links", () => {
  const file = {
    body: `# Welcome

~~Old~~ and [[Other Note|another note]].

![[Not yet supported]]

<script>alert("nope")</script>
`,
    links: [
      {
        label: "another note",
        resolvedPath: "notes/Other Note",
        target: "Other Note",
        type: "link",
      },
    ],
  } as const;
  const resolveWikiLink: ResolveWikiLink = (link) => `/${link.resolvedPath ?? link.target}`;
  const html = renderToStaticMarkup(
    <ObsidianMarkdown links={file.links} resolveWikiLink={resolveWikiLink}>
      {file.body}
    </ObsidianMarkdown>,
  );

  expect(html).toContain("<h1>Welcome</h1>");
  expect(html).toContain("<del>Old</del>");
  expect(html).toContain('<a href="/notes/Other%20Note">another note</a>');
  expect(html).toContain("![[Not yet supported]]");
  expect(html).not.toContain("<script");
});

test("renders resolved local Obsidian image embeds, dimensions, and missing images", () => {
  const resolveWikiImage: ResolveWikiImage = (target) => {
    if (target === "images/an_image.png") {
      return "/assets/an_image.123.png";
    }

    return null;
  };
  const html = renderToStaticMarkup(
    <ObsidianMarkdown resolveWikiImage={resolveWikiImage}>
      {`Before ![[images/an_image.png|An image]] after.

![[images/an_image.png|320]]

![[images/an_image.png|640x360]]

![[missing.png]]`}
    </ObsidianMarkdown>,
  );

  expect(html).toContain('<img src="/assets/an_image.123.png" alt="An image"/>');
  expect(html).toContain(
    '<img src="/assets/an_image.123.png" alt="images/an_image.png" width="320"/>',
  );
  expect(html).toContain(
    '<img src="/assets/an_image.123.png" alt="images/an_image.png" height="360" width="640"/>',
  );
  expect(html).toContain("![[missing.png]]");
});
