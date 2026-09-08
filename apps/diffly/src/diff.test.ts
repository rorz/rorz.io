import { describe, expect, test } from "bun:test";
import { createDiff } from "./diff.ts";

describe("createDiff", () => {
  test("normalizes Windows and classic Mac line endings before comparing", () => {
    expect(createDiff("first\r\nsecond\r\n", "first\nsecond\n", false)).toBe("");
    expect(createDiff("first\rsecond\r", "first\nsecond\n", true)).toBe("");
  });

  test("preserves the original insertion-first ordering when LCS lengths tie", () => {
    expect(createDiff("first\nold\nlast", "first\nnew\nlast", false)).toBe(
      " first\n+new\n-old\n last",
    );
    expect(createDiff("a\nb\na", "a\na\nb", false)).toBe(" a\n+a\n b\n-a");
  });

  test("keeps blank lines and whitespace but does not invent a line after a terminal newline", () => {
    expect(createDiff("first\n\n  old\n", "first\n\n  new\n", false)).toBe(
      " first\n \n+  new\n-  old",
    );
    expect(createDiff("", "\n", false)).toBe("+");
  });

  test("handles empty inputs as additions or removals", () => {
    expect(createDiff("", "", true)).toBe("");
    expect(createDiff("", "first\nsecond", false)).toBe("+first\n+second");
    expect(createDiff("first\nsecond", "", false)).toBe("-first\n-second");
  });

  test("uses zero-based empty ranges and compact single-line ranges in metadata", () => {
    expect(createDiff("", "new", true)).toBe(
      "diff --git a/input.txt b/input.txt\n--- a/input.txt\n+++ b/input.txt\n@@ -0,0 +1 @@\n+new",
    );
    expect(createDiff("old\nsecond", "", true)).toBe(
      "diff --git a/input.txt b/input.txt\n--- a/input.txt\n+++ b/input.txt\n@@ -1,2 +0,0 @@\n-old\n-second",
    );
    expect(createDiff("old", "new", true)).toBe(
      "diff --git a/input.txt b/input.txt\n--- a/input.txt\n+++ b/input.txt\n@@ -1 +1 @@\n+new\n-old",
    );
  });
});
