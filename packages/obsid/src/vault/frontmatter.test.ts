import { describe, expect, test } from "bun:test";
import { defineObsidSchema } from "../config/schema.ts";
import { date, text } from "../property/index.ts";
import { parseVaultSource } from "./frontmatter.ts";

const schema = defineObsidSchema({
  defaultType: "page",
  registry: {
    journal: {
      properties: {
        date: date(),
      },
      renderer: ({ date: publishedAt }) => publishedAt.toISOString(),
    },
    page: {
      properties: {
        title: text().optional(),
      },
      renderer: ({ title }) => {
        if (title?.type === "string") {
          return title.value;
        }

        return null;
      },
    },
  },
  typeIdentifier: "display_as",
});

describe("parseVaultSource", () => {
  test("uses the default registry definition", () => {
    expect(
      parseVaultSource(
        `---
title: Welcome
ignored: value
---
# Hello`,
        "Welcome",
        schema,
      ),
    ).toEqual({
      body: "# Hello",
      frontmatter: {
        ignored: "value",
        title: "Welcome",
      },
      pageType: "page",
      properties: {
        title: {
          raw: "Welcome",
          type: "string",
          value: "Welcome",
        },
      },
    });
  });

  test("selects a registry definition with the type identifier", () => {
    const parsed = parseVaultSource(
      `---
display_as: journal
date: 2026-07-27
---
Entry`,
      "Journal",
      schema,
    );

    expect(parsed.pageType).toBe("journal");
    expect(parsed.properties).toEqual({
      date: new Date("2026-07-27"),
    });
  });

  test("rejects unknown page types", () => {
    expect(() =>
      parseVaultSource(
        `---
display_as: missing
---
Entry`,
        "Missing",
        schema,
      ),
    ).toThrow('Unknown page type "missing" in Missing.md');
  });
});
