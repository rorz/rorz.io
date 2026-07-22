import { describe, expect, test } from "bun:test";
import { isActiveNavigationPath } from "./path.ts";

describe("isActiveNavigationPath", () => {
  test("matches a section and its descendants", () => {
    expect(isActiveNavigationPath("/posts", "/posts")).toBe(true);
    expect(isActiveNavigationPath("/posts/an-article", "/posts")).toBe(true);
  });

  test("does not match path prefixes or unresolved links", () => {
    expect(isActiveNavigationPath("/postscript", "/posts")).toBe(false);
    expect(isActiveNavigationPath("/posts", "#unresolved-posts")).toBe(false);
  });

  test("only matches the home link at the root", () => {
    expect(isActiveNavigationPath("/", "/")).toBe(true);
    expect(isActiveNavigationPath("/posts", "/")).toBe(false);
  });
});
