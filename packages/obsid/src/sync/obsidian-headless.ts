import { $, resolveSync } from "bun";
import type { ObsidConfig } from "../config/index.ts";

const OB_COMMANDS = [
  "login",
  "sync-setup",
  "sync-config",
  "sync",
] as const;

type ObCommand = (typeof OB_COMMANDS)[number];

const OB_CLI_PATH = resolveSync("obsidian-headless/cli.js", import.meta.dir);

const logger = (level: "info" | "warn" | "error", command: ObCommand, ...args: unknown[]) => {
  // biome-ignore lint/suspicious/noConsole: CLI progress is intentionally written to the terminal.
  console[level](`[command = ${command}]`, args);
};

const obCommand = async (command: ObCommand, args: string[]) => {
  const output = await $`node ${OB_CLI_PATH} ${command} ${args}`.text();
  logger("info", command, output);
  return output;
};

export const logIn = async (opts: ObsidConfig["login"]) => {
  const output = await obCommand("login", [
    "--email",
    opts.email,
    "--password",
    opts.password,
  ]);
  return output;
};

export const syncSetup = async (opts: {
  vault: string;
  deviceName: string;
  path: string;
  encryptionPassword: string | undefined;
}) => {
  const args = [
    "--vault",
    opts.vault,
    "--device-name",
    opts.deviceName,
    "--path",
    opts.path,
  ];
  if (opts.encryptionPassword) {
    args.push("--password", opts.encryptionPassword);
  }

  const output = await obCommand("sync-setup", args);
  return output;
};

export const syncConfig = async (opts: { path: string }) => {
  const output = await obCommand("sync-config", [
    "--path",
    opts.path,
    "--mode",
    "mirror-remote",
  ]);
  return output;
};

export const syncVault = async (opts: { path: string }) => {
  const output = await obCommand("sync", [
    "--path",
    opts.path,
  ]);
  return output;
};
