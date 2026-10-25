# Paradigm Puzzles

A collection of web views built with React, TypeScript, Vite, and Tailwind CSS, deployed as Cloudflare static assets. `/` is an empty black screen. View components live in `src/views/`.

## Shape packing

Open `/shape-packing` for the monochrome semicircle editor. It starts with an editable 12 + 3 fan arrangement, not a proposed solution. Add and remove fans; adjust count, orbit radius, rotation, spread, tilt, and origin. Full rings space N shapes without repeating the endpoint; partial fans include both ends of their spread. Locking θ shares the tilt relative to each shape's radial direction. All semicircles have radius 1.

Drag a semicircle or the selected fan's origin to move that fan. Drag empty space or Shift-drag to pan; scroll or use +/− to zoom. Fit restores automatic framing. The focused canvas also supports arrow-key panning and 0 to fit. Undo/Redo groups continuous edits. The inspector exposes placement JSON, fan parameters, and intersecting pairs; JSON can be copied or downloaded.

Coordinates use +Y up. Export follows the [puzzle contract](https://www.paradigm.xyz/puzzles/packing/about): an array of `{x, y, theta}` with the disk center at `(x, y)` and the curved half facing absolute `theta` radians. Coordinates and angles are rounded to six decimals **before** rendering and measurement. Exactly 15 shapes are required by the puzzle; the editor allows up to 120 for exploration.

Geometry lives independently in `src/packing/`. Intersections integrate circular arcs and clipped diameters analytically using Green's theorem. Hatching marks pairs whose intersection area exceeds 1e−6. The published validator uses high-resolution polygons, so borderline decisions can differ slightly. Enclosure uses an incremental point-circle solve refined with analytic farthest points; the displayed radius encloses every arc and diagnostics report its numerical excess bound. There is no packing optimizer or automatic submission.

Run these commands from the repository root:

- `bun run dev:paradigm-puzzles` starts development at `http://127.0.0.1:4447`.
- `bun run build:paradigm-puzzles` builds the app into `apps/paradigm-puzzles/dist`.
- `bun run start:paradigm-puzzles` previews that build on port 4447.
- `bun run deploy:paradigm-puzzles:dry` validates the Cloudflare deployment locally.
- `bun run deploy:paradigm-puzzles` publishes to `paradigm-puzzles.rorz.io`.

The app participates in the root `check`, `build`, and `verify` commands.
