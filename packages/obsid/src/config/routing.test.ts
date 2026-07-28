import { describe, expect, test } from "bun:test";
import { getWebPath, slugify } from "./routing.ts";

describe("slugify", () => {
  test("creates lowercase, URL-safe path segments", () => {
    expect(slugify("New York-style pizza (whole)")).toBe("new-york-style-pizza-whole");
    expect(slugify("Lauretta's")).toBe("laurettas");
    expect(slugify("Crème brûlée")).toBe("creme-brulee");
  });
});

describe("getWebPath", () => {
  test("uses the default permalink and configurable slugifier", () => {
    expect(getWebPath({}, "Posts/Hello World")).toBe("/posts/hello-world");
    expect(
      getWebPath(
        {
          routing: {
            slugify: (value) => value.toUpperCase(),
          },
        },
        "posts/hello",
      ),
    ).toBe("/POSTS/HELLO");
  });

  test("supports a custom permalink", () => {
    expect(
      getWebPath(
        {
          routing: {
            permalink: ({ slugify: createSlug, vaultPath }) => `/writing/${createSlug(vaultPath)}`,
          },
        },
        "Posts/Hello World",
      ),
    ).toBe("/writing/posts-hello-world");
  });

  test("rejects values that are not root-relative web paths", () => {
    expect(() =>
      getWebPath(
        {
          routing: {
            permalink: () => "posts/hello",
          },
        },
        "posts/hello",
      ),
    ).toThrow("must return a root-relative web path");
  });
});
