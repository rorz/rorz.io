import { describe, expect, test } from "bun:test";
import { parseCliArgs } from "./index.ts";

describe("obsid CLI", () => {
  test("parses the sync config path", () => {
    expect(
      parseCliArgs([
        "sync",
        "--config",
        "../../private/obsid.config.ts",
      ]),
    ).toEqual({
      command: "sync",
      configPath: "../../private/obsid.config.ts",
    });
  });

  test("supports the short config option", () => {
    expect(
      parseCliArgs([
        "sync",
        "-c",
        "custom.config.ts",
      ]),
    ).toEqual({
      command: "sync",
      configPath: "custom.config.ts",
    });
  });

  test("defaults the config path", () => {
    expect(
      parseCliArgs([
        "sync",
      ]),
    ).toEqual({
      command: "sync",
      configPath: "obsid.config.ts",
    });
  });

  test("supports help", () => {
    expect(
      parseCliArgs([
        "--help",
      ]),
    ).toEqual({
      command: "help",
    });
  });
});
