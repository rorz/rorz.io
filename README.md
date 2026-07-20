# rorz.io

A Bun monorepo containing a Vinext App Router project.

## Workspaces

- `apps/web` — the rorz.io web app

## Commands

- `bun run dev` — run the web app locally
- `bun run build` — build the web app
- `bun run check` — Biome, TypeScript, Knip, tests, and Pokayoke
- `bun run verify` — the complete check plus a production Vinext build
- `bun run check:biome:fix` — apply Biome's safe and unsafe fixes
- `bun run knip:fix` — apply Knip fixes
- `bun run pokayoke:fix` — apply project-policy fixes

Run commands from the repository root. Zed exposes every root package script as a
project task. Install Zed's Biome extension to get the same formatter and diagnostics
in the editor. Pokayoke regenerates the task file and rejects drift from `package.json`.
