# rorz.io

A Vinext App Router project running on Bun.

## Commands

- `bun run dev` — local development
- `bun run build` — production build
- `bun run check` — Biome, TypeScript, Knip, tests, and Pokayoke
- `bun run verify` — the complete check plus a production Vinext build
- `bun run check:biome:fix` — apply Biome's safe and unsafe fixes
- `bun run knip:fix` — apply Knip fixes
- `bun run pokayoke:fix` — apply project-policy fixes

Zed exposes every package script as a project task. Install Zed's Biome extension
to get the same formatter and diagnostics in the editor. Pokayoke regenerates the
task file and rejects drift from `package.json`.
