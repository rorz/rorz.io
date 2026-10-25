# Paradigm Puzzles

A collection of web views built with React, TypeScript, Vite, and Tailwind CSS, deployed as Cloudflare static assets. `/` is an empty black screen. View components live in `src/views/`.

## Shape packing

Open `/shape-packing` for the monochrome semicircle editor. It starts with an editable 12 + 3 fan arrangement, not a proposed solution. Add and remove fans; adjust count, orbit radius, rotation, spread, tilt, and origin. Full rings space N shapes without repeating the endpoint; partial fans include both ends of their spread. Locking θ shares the tilt relative to each shape's radial direction. All semicircles have radius 1.

Changing **Semicircles / N** redistributes the fan across its spread, which can create overlaps even when the count decreases. **Remove last, keep positions** instead deletes the last semicircle and adjusts the spread to preserve all remaining placements. For example, a 12-shape full ring becomes an 11-shape fan with a 300° spread and the same 30° spacing. This retains a valid starting packing for Tighten.

Drag a semicircle or the selected fan's origin to move that fan. Drag empty space or Shift-drag to pan; scroll or use +/− to zoom. Fit restores automatic framing. The focused canvas also supports arrow-key panning and 0 to fit. Undo/Redo groups continuous edits. The inspector exposes placement JSON, fan parameters, and intersecting pairs; JSON can be copied or downloaded.

**Save…** captures a named snapshot of every fan, the θ lock, selection, display toggles, camera, inspector, and search settings. **Saved** opens the right drawer to load or remove snapshots (with Undo removal). Snapshots persist in this browser's local storage across reloads; they do not sync between devices. Storage failures are shown without overwriting existing data.

**Tighten…** runs a multistart pattern search in a Web Worker for the allotted time. Choose which parameter groups it can adjust; counts remain fixed and linked or held θ values are respected. Steps shrink during local refinement, then seeded perturbations restart nearby and farther away. Trial arrangements may temporarily overlap or expand; the preview retains the best result, which can never get worse once collision-free. Stop at any time, then Keep the preview as one undoable edit or Revert. The same exact scene, options, and seed generate the same candidate sequence, but wall-clock timing can change how much of that sequence runs. Use snapshots to reproduce the full starting settings. Loading one cancels an active search. This remains a heuristic with no proof of optimality.

When the starting arrangement overlaps, Tighten first repairs those overlaps, which can require a larger radius. The drawer warns before starting and reports the original overlap count beside the result so that repair is distinguishable from radius improvement. Evenly spaced fans constrain the search: a smaller count with a different spacing is not guaranteed to fit as tightly as the previous fan.

For a shared-tip fan like a three-lobed pinwheel: unlock θ, select the inner fan, set N to 3, orbit radius to 1, spread to 360°, and tilt θ to ±90°. Each semicircle then has a diameter endpoint at the fan origin. Rotation φ turns the group; changing the orbit opens or closes the central gap. More lobes may overlap, as the collision display will show.

For two opposing halves that slide along their shared diameter line: use N = 2, spread = 360°, θ = 90°, and vary the orbit between 0 and 1. At 0 they form a disk; at 1 their tips meet. Rotation φ turns the pair (φ = −15° gives an absolute normal θ of 75°). Enable **Hold this fan’s θ during Tighten** to retain that alignment while allowing the outer fan's tilt to change. If θ is linked, holding any fan holds the shared tilt for all fans. Holds and search seeds are included in snapshots; older snapshots still load.

Coordinates use +Y up. Export follows the [puzzle contract](https://www.paradigm.xyz/puzzles/packing/about): an array of `{x, y, theta}` with the disk center at `(x, y)` and the curved half facing absolute `theta` radians. Coordinates and angles are rounded to six decimals **before** rendering and measurement. Exactly 15 shapes are required by the puzzle; the editor allows up to 120 for exploration.

Geometry lives independently in `src/packing/`. Intersections integrate circular arcs and clipped diameters analytically using Green's theorem. Hatching marks pairs whose intersection area exceeds 1e−6. The published validator uses high-resolution polygons, so borderline decisions can differ slightly. Enclosure uses an incremental point-circle solve refined with analytic farthest points; the displayed radius encloses every arc and diagnostics report its numerical excess bound. There is no automatic submission.

Run these commands from the repository root:

- `bun run dev:paradigm-puzzles` starts development at `http://127.0.0.1:4447`.
- `bun run build:paradigm-puzzles` builds the app into `apps/paradigm-puzzles/dist`.
- `bun run start:paradigm-puzzles` previews that build on port 4447.
- `bun run deploy:paradigm-puzzles:dry` validates the Cloudflare deployment locally.
- `bun run deploy:paradigm-puzzles` publishes to `paradigm-puzzles.rorz.io`.

The app participates in the root `check`, `build`, and `verify` commands.
