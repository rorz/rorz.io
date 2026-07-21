import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ObsidianMarkdown } from "./markdown.tsx";

test("renders a vault body and resolves its structured wiki links", () => {
  const file = {
    body: `# Welcome

~~Old~~ and [[Other Note|another note]].

![[Not yet supported]]

<script>alert("nope")</script>
`,
    links: [
      {
        resolvedPath: "notes/Other Note",
        target: "Other Note",
      },
    ],
  };
  const html = renderToStaticMarkup(
    createElement(ObsidianMarkdown, {
      file,
      resolveWikiLink: (link) => `/${link.resolvedPath ?? link.target}`,
    }),
  );

  expect(html).toContain("<h1>Welcome</h1>");
  expect(html).toContain("<del>Old</del>");
  expect(html).toContain('<a href="/notes/Other%20Note">another note</a>');
  expect(html).toContain("![[Not yet supported]]");
  expect(html).not.toContain("<script");
});
