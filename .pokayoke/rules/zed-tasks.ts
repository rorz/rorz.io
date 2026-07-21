interface ZedTask {
  readonly allow_concurrent_runs: boolean;
  readonly args: readonly string[];
  readonly command: "bun";
  readonly cwd: "$ZED_WORKTREE_ROOT";
  readonly hide: "never" | "on_success";
  readonly label: string;
  readonly reveal: "always";
  readonly save: "all";
  readonly use_new_terminal: boolean;
}

const expandedArgsPattern = /"args": \[\n {6}"run",\n {6}"([^"]+)"\n {4}\]/gu;

const createZedTasks = (scripts: Readonly<Record<string, string>>): readonly ZedTask[] =>
  Object.keys(scripts)
    .toSorted()
    .map((script) => {
      const keepsRunning = script === "dev" || script === "start";
      let hide: ZedTask["hide"] = "on_success";

      if (keepsRunning) {
        hide = "never";
      }

      return {
        allow_concurrent_runs: false,
        args: [
          "run",
          script,
        ],
        command: "bun",
        cwd: "$ZED_WORKTREE_ROOT",
        hide,
        label: `bun: ${script}`,
        reveal: "always",
        save: "all",
        use_new_terminal: keepsRunning,
      };
    });

const renderZedTasks = (scripts: Readonly<Record<string, string>>): string =>
  `${JSON.stringify(createZedTasks(scripts), null, 2)}\n`.replace(
    expandedArgsPattern,
    '"args": ["run", "$1"]',
  );

export { renderZedTasks };
