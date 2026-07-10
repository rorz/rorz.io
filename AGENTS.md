# Project contract

- Use Bun for installs, scripts, tests, and one-off executables.
- Treat `package.json#scripts` as the command source of truth.
- Run `bun run verify` before handing work back.
- Use App Router conventions under `app/`; Vinext supplies the Next.js-compatible runtime.
- Do not start or replace a development server unless the user asks. If one is already running, reuse it.
- Keep `.zed/tasks.json` in sync by running `bun run pokayoke:fix` after script changes.
- Keep repository policy in `.pokayoke/rules` and add focused tests beside each local rule.
