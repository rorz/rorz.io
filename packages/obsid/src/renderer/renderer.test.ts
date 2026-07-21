import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getFileFromLoaders } from "./file-store.ts";

describe("getFile", () => {
  test("loads one exact Markdown file lazily", async () => {
    let loads = 0;
    const file = await getFileFromLoaders(
      {
        "/.obsidian-vaults/rorz.io/Welcome.md": () => {
          loads += 1;
          return Promise.resolve("# Welcome");
        },
      },
      "rorz.io",
      "/Welcome.md",
    );

    expect(loads).toBe(1);
    expect(file?.path).toBe("Welcome");
    expect(file?.source).toBe("# Welcome");
  });

  test("returns null for missing files and unsafe vault or file paths", async () => {
    expect(await getFileFromLoaders({}, "rorz.io", "Missing")).toBeNull();
    expect(await getFileFromLoaders({}, "../rorz.io", "Welcome")).toBeNull();
    expect(await getFileFromLoaders({}, "rorz.io", "../Welcome")).toBeNull();
    expect(await getFileFromLoaders({}, "rorz.io", "folder//Welcome")).toBeNull();
  });

  test("renders GFM and Obsidian wikilinks without frontmatter or raw HTML", async () => {
    const file = await getFileFromLoaders(
      {
        "/.obsidian-vaults/rorz.io/Welcome.md": () =>
          Promise.resolve(`---
title: Hidden
---

# Welcome

~~Old~~ and [[Other Note|another note]].

![[Not yet supported]]

<script>alert("nope")</script>
`),
      },
      "rorz.io",
      "Welcome",
    );

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
