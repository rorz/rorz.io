import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ObsidianMarkdown } from "./markdown.tsx";

test("renders GFM and Obsidian wikilinks without frontmatter or raw HTML", () => {
  const file = {
    path: "Welcome",
    source: `---
title: Hidden
---

# Welcome

~~Old~~ and [[Other Note|another note]].

![[Not yet supported]]

<script>alert("nope")</script>
`,
  };
  const html = renderToStaticMarkup(
    createElement(ObsidianMarkdown, {
      file,
      resolveWikiLink: (target) => `/notes/${target.toLowerCase().replaceAll(" ", "-")}`,
    }),
  );

  expect(html).toContain("<h1>Welcome</h1>");
  expect(html).toContain("<del>Old</del>");
  expect(html).toContain('<a href="/notes/other-note">another note</a>');
  expect(html).toContain("![[Not yet supported]]");
  expect(html).not.toContain("title: Hidden");
  expect(html).not.toContain("<script");
});
