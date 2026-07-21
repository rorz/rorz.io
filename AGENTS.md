# Project contract

- Use Bun for installs, scripts, tests, and one-off executables.
- Treat root `package.json#scripts` as repo commands and workspace scripts as package commands.
- Run `bun run verify` before handing work back.
- Use App Router conventions under `apps/web/app/`; Vinext supplies the Next.js-compatible runtime.
- Do not start or replace a development server unless the user asks. If one is already running, reuse it.
- Keep `.zed/tasks.json` in sync by running `bun run pokayoke:fix` after script changes.
- Keep repository policy in `.pokayoke/rules` and add focused tests beside each local rule.
- ALWAYS run `bun run check` before completing a task. UNLESS you are SURE the check result contains issues completely unrelated to your changes (advise the human nonetheless if this is the case!).
