import { afterEach, describe, expect, test } from "bun:test";
import { env, resolveSync } from "bun";
import { defineConfig, loadConfig } from "./index.ts";

const CONFIG_ENV_NAMES = [
  "OBSID_EMAIL",
  "OBSID_PASSWORD",
  "OBSID_VAULT_PRIMARY_PASSWORD",
  "OBSID_VAULT_ALT_PASSWORD",
] as const;

const originalConfigEnv = new Map(
  CONFIG_ENV_NAMES.map((name) => [
    name,
    env[name],
  ]),
);

afterEach(() => {
  for (const [name, value] of originalConfigEnv) {
    if (value === undefined) {
      delete env[name];
    } else {
      env[name] = value;
    }
  }
});

describe("obsid config", () => {
  test("applies defaults to typed config", () => {
    const config = defineConfig({
      login: {
        email: "test@example.com",
        password: "test-password",
      },
      vaults: [],
    });

    expect(config.vaultsFolder).toBe("./.obsidian-vaults/");
  });

  test("rejects missing environment-backed values", () => {
    expect(() =>
      defineConfig({
        login: {
          email: "",
          password: "",
        },
        vaults: [],
      }),
    ).toThrow();
  });

  test("rejects JSON config files", async () => {
    await expect(loadConfig("obsid.config.json")).rejects.toThrow(
      "Config must be a TypeScript file",
    );
  });

  test("loads the web TypeScript config", async () => {
    env.OBSID_EMAIL = "test@example.com";
    env.OBSID_PASSWORD = "test-password";
    env.OBSID_VAULT_PRIMARY_PASSWORD = "primary-password";
    env.OBSID_VAULT_ALT_PASSWORD = "alt-password";

    const configPath = resolveSync("../../../../apps/web/obsid.config.ts", import.meta.dir);
    const config = await loadConfig(configPath);

    expect(config.vaults.map((vault) => vault.name)).toEqual([
      "rorz.io",
      "rorz.io--alt",
    ]);
  });
});
