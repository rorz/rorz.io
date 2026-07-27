import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ObsidianMarkdown } from "./markdown.tsx";
import type { ResolveWikiLink } from "./types.ts";

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
