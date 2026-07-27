import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { date, list, text } from "./index.ts";

describe("text", () => {
  test("parses plain text and Obsidian links", () => {
    expect(text().parse("Hello")).toEqual({
      raw: "Hello",
      type: "string",
      value: "Hello",
    });
    expect(text().parse("[[notes/Welcome|Welcome]]")).toEqual({
      label: "Welcome",
      path: "notes/Welcome",
      raw: "[[notes/Welcome|Welcome]]",
      type: "note",
    });
    expect(text().parse("![[images/mark.svg]]")).toEqual({
      path: "images/mark.svg",
      raw: "![[images/mark.svg]]",
      type: "file",
    });
  });

  test("parses web links", () => {
    expect(text().parse("[OpenAI](https://openai.com)")).toEqual({
      label: "OpenAI",
      raw: "[OpenAI](https://openai.com)",
      type: "link",
      url: "https://openai.com",
    });
    expect(text().parse("https://openai.com")).toEqual({
      raw: "https://openai.com",
      type: "link",
      url: "https://openai.com",
    });
  });
});

describe("property modifiers", () => {
  test("composes with optional and default", () => {
    const fallbackDate = new Date("2026-07-27");
    const properties = z.object({
      aliases: list().optional(),
      publishedAt: date().default(fallbackDate),
      subtitle: text().optional(),
    });

    expect(properties.parse({})).toEqual({
      publishedAt: fallbackDate,
    });
    expect(
      properties.parse({
        aliases: [
          "One",
          "[[Two]]",
        ],
      }),
    ).toEqual({
      aliases: [
        {
          raw: "One",
          type: "string",
          value: "One",
        },
        {
          path: "Two",
          raw: "[[Two]]",
          type: "note",
        },
      ],
      publishedAt: fallbackDate,
    });
  });
});
