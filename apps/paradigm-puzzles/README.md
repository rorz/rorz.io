# Paradigm Puzzles

A collection of web views built with React, TypeScript, Vite, and Tailwind CSS, deployed as Cloudflare static assets. The initial view at `/` is an empty black screen. View components live in `src/views/`.

Run these commands from the repository root:

- `bun run dev:paradigm-puzzles` starts development at `http://127.0.0.1:4447`.
- `bun run build:paradigm-puzzles` builds the app into `apps/paradigm-puzzles/dist`.
- `bun run start:paradigm-puzzles` previews that build on port 4447.
- `bun run deploy:paradigm-puzzles:dry` validates the Cloudflare deployment locally.
- `bun run deploy:paradigm-puzzles` publishes to `paradigm-puzzles.rorz.io`.

The app participates in the root `check`, `build`, and `verify` commands.
