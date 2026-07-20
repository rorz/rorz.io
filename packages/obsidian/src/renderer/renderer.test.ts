import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createGetFile } from "./get-file.ts";

describe("getFile", () => {
  test("loads one exact Markdown file lazily", async () => {
    let loads = 0;
    const getFile = createGetFile(
      {
        "../content/Welcome.md": () => {
          loads += 1;
          return Promise.resolve("# Welcome");
        },
      },
      "../content/",
    );

    const file = await getFile("/Welcome.md");

    expect(loads).toBe(1);
    expect(file?.path).toBe("Welcome");
    expect(file?.source).toBe("# Welcome");
  });

  test("returns null for missing and unsafe paths", async () => {
    const getFile = createGetFile({}, "../content/");

    expect(await getFile("Missing")).toBeNull();
    expect(await getFile("../Welcome")).toBeNull();
    expect(await getFile("folder//Welcome")).toBeNull();
  });

  test("renders GFM and Obsidian wikilinks without frontmatter or raw HTML", async () => {
    const getFile = createGetFile(
      {
        "../content/Welcome.md": () =>
          Promise.resolve(`---
title: Hidden
---

# Welcome

~~Old~~ and [[Other Note|another note]].

![[Not yet supported]]

<script>alert("nope")</script>
`),
      },
      "../content/",
    );
    const file = await getFile("Welcome");

    expect(file).not.toBeNull();

    if (!file) {
      throw new Error("Expected the fixture file to exist.");
    }

    const html = renderToStaticMarkup(
      createElement(file.Content, {
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
});
