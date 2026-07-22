import { describe, expect, test } from "bun:test";
import { cn } from "./index.ts";

describe("cn", () => {
  test("chains conditional class names", () => {
    expect(
      cn("font-medium", false, {
        hidden: false,
        underline: true,
      }),
    ).toBe("font-medium underline");
  });

  test("resolves conflicting Tailwind utilities", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
