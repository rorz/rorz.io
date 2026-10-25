# rorz.io

This is the repository for my personal site and small projects hosted on its subdomains.

It's a Bun monorepo:

| Workspace                                                  | Purpose                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `apps/web`                                                 | The personal site at `rorz.io`, built with Vinext and Obsidian content.                     |
| [`apps/diffly`](apps/diffly/README.md)                     | The text diff tool at `diffly.rorz.io`, built with React, TypeScript, and Vite.             |
| [`apps/jevball`](apps/jevball/README.md)                   | Magic-Jev-Ball: a Jev-backed Magic 8 Ball, built with React, Vite, and Cloudflare Workers.  |
| [`apps/paradigm-puzzles`](apps/paradigm-puzzles/README.md) | Web views built with React, TypeScript, Vite, and Tailwind CSS; starts with a black screen. |
| `packages/obsid`                                           | A work-in-progress package for turning Obsidian vault content into static pages.            |
| `packages/scripts`                                         | Repository maintenance scripts.                                                             |

Use Bun 1.4.4 or newer and run `bun install` from the root. `bun run check` checks the repository and its workspaces; `bun run build` builds every app; `bun run verify` does both.

`bun run dev` starts the personal site on port 4444. `bun run dev:diffly` starts Diffly on port 4445; `bun run dev:jevball` starts Magic-Jev-Ball on port 4446; `bun run dev:paradigm-puzzles` starts Paradigm Puzzles on port 4447. Each app is developed and deployed independently. `bun run build:web` syncs the vault and builds only the personal site.

Shared dependency versions live in the root `package.json#catalog` and are referenced with `catalog:` in each workspace. Use `bun run deps:outdated` to check versions and `bun run deps:audit` to check advisories. After changing dependencies, run `bun install` and `bun run verify`.

Two scoped overrides patch upstream pins: Miniflare's Undici is fixed at 7.30.1 and Satori's fflate at 0.7.5. Remove them once those upstream packages include the fixes. The existing Obsidian Headless patch remains covered by its regression tests.
