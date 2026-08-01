import { describe, expect, test } from "bun:test";
import { defineSchema, note, p } from "../config/schema.ts";
import { parseVaultSource } from "./frontmatter.ts";

const journal = note("journal", {
  date: p.date(),
});
const page = note("page", {
  title: p.text().optional(),
});
const schema = defineSchema({
  default: page,
  discriminator: "display_as",
  notes: [
    journal,
    page,
  ],
});

describe("parseVaultSource", () => {
  test("uses the default note definition and parses its properties", () => {
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
      kind: "page",
      properties: {
        title: {
          raw: "Welcome",
          type: "string",
          value: "Welcome",
        },
      },
    });
  });

  test("selects a note definition with the discriminator", () => {
    const parsed = parseVaultSource(
      `---
display_as: journal
date: 2026-07-27
---
Entry`,
      "Journal",
      schema,
    );

    expect(parsed.kind).toBe("journal");
    expect(parsed.properties).toEqual({
      date: new Date("2026-07-27"),
    });
  });

  test("rejects unknown note kinds", () => {
    expect(() =>
      parseVaultSource(
        `---
display_as: missing
---
Entry`,
        "Missing",
        schema,
      ),
    ).toThrow('Unknown note kind "missing" in Missing.md');
  });
});
