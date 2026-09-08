# rorz.io

This is the repository for my personal site and small projects hosted on its subdomains.

It's a Bun monorepo:

| Workspace | Purpose |
| --- | --- |
| `apps/web` | The personal site at `rorz.io`, built with Vinext and Obsidian content. |
| [`apps/diffly`](apps/diffly/README.md) | The text diff tool at `diffly.rorz.io`, built with React, TypeScript, and Vite. |
| `packages/obsid` | A work-in-progress package for turning Obsidian vault content into static pages. |
| `packages/scripts` | Repository maintenance scripts. |

Run `bun install` from the root. `bun run check` checks the repository and its workspaces; `bun run build` builds every app; `bun run verify` does both.

`bun run dev` starts the personal site on port 4444. `bun run dev:diffly` starts Diffly on port 4445. Each app is developed and deployed independently. `bun run build:cloudflare` still syncs the vault and builds only the personal site.
