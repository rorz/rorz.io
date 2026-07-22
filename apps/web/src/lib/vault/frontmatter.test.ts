import { describe, expect, test } from "bun:test";
import { z } from "zod";
import {
  frontmatterSchema,
  linkListEntryFrontmatterSchema,
  parseFrontmatter,
  rootFrontmatterSchema,
} from "./frontmatter.ts";

const displayAsKey = "display_as";

const createSource = (frontmatter: unknown, path = "posts/Example") => ({
  frontmatter,
  path,
});

describe("frontmatterSchema", () => {
  test("parses every tracked property and narrows link-list pages", () => {
    const frontmatter = parseFrontmatter(
      createSource({
        date: "2026-07-22",
        directories: [
          {
            label: "Posts",
            resolvedPath: "posts/page",
            target: "posts/page",
            type: "link",
          },
        ],
        [displayAsKey]: "link-list",
        slug: "journal",
        title: "Journal",
      }),
      frontmatterSchema,
    );

    expect(frontmatter).toEqual({
      date: "2026-07-22",
      directories: [
        {
          label: "Posts",
          resolvedPath: "posts/page",
          target: "posts/page",
          type: "link",
        },
      ],
      [displayAsKey]: "link-list",
      slug: "journal",
      title: "Journal",
    });
  });

  test("ignores untracked properties", () => {
    expect(
      parseFrontmatter(
        createSource({
          published: true,
        }),
        frontmatterSchema,
      ),
    ).toEqual({});
  });
});

describe("page-specific frontmatter schemas", () => {
  test("requires navigation links on the root page", () => {
    expect(() => parseFrontmatter(createSource({}, "page"), rootFrontmatterSchema)).toThrow(
      "Invalid frontmatter in page.md",
    );
  });

  test("requires an ISO date on link-list entries", () => {
    expect(() =>
      parseFrontmatter(
        createSource({
          date: "22 July 2026",
        }),
        linkListEntryFrontmatterSchema,
      ),
    ).toThrow("Invalid frontmatter in posts/Example.md");
  });
});

describe("parseFrontmatter", () => {
  test("accepts a caller-provided schema", () => {
    const schema = z.object({
      featured: z.boolean(),
    });

    expect(
      parseFrontmatter(
        createSource({
          featured: true,
        }),
        schema,
      ),
    ).toEqual({
      featured: true,
    });
  });
});
