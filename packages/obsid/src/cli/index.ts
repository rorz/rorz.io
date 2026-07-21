#!/usr/bin/env bun

import { argv, stdout, write } from "bun";
import { loadConfig } from "../config/index.ts";
import { sync } from "../sync/index.ts";

const DEFAULT_CONFIG_PATH = "obsid.config.ts";
const USAGE = "Usage: obsid sync [--config <path>]";

type CliArgs =
  | {
      command: "help";
    }
  | {
      command: "sync";
      configPath: string;
    };

const parseCliArgs = (args: string[]): CliArgs => {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return {
      command: "help",
    };
  }

  const [command, ...options] = args;
  if (command !== "sync") {
    throw new Error(`Unknown command: ${command}`);
  }

  let configPath: string | undefined;

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (option !== "--config" && option !== "-c") {
      throw new Error(`Unknown option: ${option}`);
    }

    const value = options[index + 1];
    if (!value || value.startsWith("-")) {
      throw new Error(`${option} requires a path`);
    }

    configPath = value;
    index += 1;
  }

  return {
    command,
    configPath: configPath ?? DEFAULT_CONFIG_PATH,
  };
};

const runCli = async (args: string[]): Promise<void> => {
  const parsedArgs = parseCliArgs(args);

  if (parsedArgs.command === "help") {
    await write(stdout, `${USAGE}\n`);
    return;
  }

  const config = await loadConfig(parsedArgs.configPath);
  await sync(config);
};

if (import.meta.main) {
  await runCli(argv.slice(2));
}

export { parseCliArgs, runCli };
