# Paradigm Puzzles

A collection of web views built with React, TypeScript, Vite, and Tailwind CSS, deployed as Cloudflare static assets. `/` is an empty black screen. View components live in `src/views/`.

The [research journal](research/README.md) records the packing campaign, validated score history, unsuccessful experiments, corrected interpretations, and remaining avenues. Its [best-result snapshots](research/best/placements.json) and selected evidence are versioned alongside it.

## Shape packing

Open `/shape-packing` for the monochrome semicircle editor. It starts with an editable 12 + 3 fan arrangement, not a proposed solution. Add and remove fans; adjust count, orbit radius, rotation, spread, tilt, and origin. Full rings space N shapes without repeating the endpoint; partial fans include both ends of their spread. Locking θ shares the tilt relative to each shape's radial direction. All semicircles have radius 1.

Changing **Semicircles / N** redistributes the fan across its spread, which can create overlaps even when the count decreases. **Remove last, keep positions** instead deletes the last semicircle and adjusts the spread to preserve all remaining placements. For example, a 12-shape full ring becomes an 11-shape fan with a 300° spread and the same 30° spacing. This retains a valid starting packing for Tighten.

Drag a semicircle or the selected fan's origin to move that fan. Drag empty space or Shift-drag to pan; scroll or use +/− to zoom. Fit restores automatic framing. The focused canvas also supports arrow-key panning and 0 to fit. Undo/Redo groups continuous edits. The inspector exposes placement JSON, fan parameters, and intersecting pairs; JSON can be copied or downloaded.

**Save…** captures a named snapshot of every fan, the θ lock, selection, display toggles, camera, inspector, and search settings. **Saved** opens the right drawer to load or remove snapshots (with Undo removal). Snapshots persist in this browser's local storage across reloads; they do not sync between devices. Storage failures are shown without overwriting existing data.

**Tighten…** runs a multistart pattern search in a Web Worker for the allotted time. Choose which parameter groups it can adjust; counts remain fixed and linked or held θ values are respected. Steps shrink during local refinement, then seeded perturbations restart nearby and farther away. Trial arrangements may temporarily overlap or expand; the preview retains the best result, which can never get worse once collision-free. Stop at any time, then Keep the preview as one undoable edit or Revert. The same exact scene, options, and seed generate the same candidate sequence, but wall-clock timing can change how much of that sequence runs. Use snapshots to reproduce the full starting settings. Loading one cancels an active search. This remains a heuristic with no proof of optimality.

When the starting arrangement overlaps, Tighten first repairs those overlaps, which can require a larger radius. The drawer warns before starting and reports the original overlap count beside the result so that repair is distinguishable from radius improvement. Evenly spaced fans constrain the search: a smaller count with a different spacing is not guaranteed to fit as tightly as the previous fan.

**Relax…** starts from a collision-free arrangement and searches coordinated changes to several groups at once. With **Lock threefold symmetry** enabled, full fans whose counts are divisible by three are split into triplets repeating every 120° around a shared origin. A 12 + 3 arrangement becomes five triplets with independent orbit radii, phases, and tilts. Disable the symmetry lock to explore individual semicircles instead. Both modes respect the parameter toggles and linked/held tilts; origins and fan spreads stay fixed. Keep commits the best valid result as editable fan layers in one undoable change. Revert restores the original arrangement, including its original grouping.

Relax uses an augmented-Lagrangian constrained solve with limited-memory BFGS and analytic derivatives of the semicircle contacts and enclosing boundary. It optimizes full-precision positions, rotations, and enclosing radius together. Fully independent pieces use Cartesian coordinates, avoiding the coupled orbit/phase/tilt directions near a jam. Their container center is fixed because translating every piece provides the same freedom; constrained fan searches retain their original parameterization. A separate validator rounds placements to six decimals and checks analytic intersection areas before accepting any result. The contact objective includes a small positive clearance margin, while the editor's 1e−6 area tolerance still defines acceptance.

With symmetry off and all position/angle controls enabled, Relax maintains six search replicas at different temperatures. Each trial minimizes the enclosing radius with free translations and rotations; replicas may accept larger valid packings, then exchange arrangements so that an exploratory replica can supply a new starting point to a more selective one. This allows routes through larger containers that fixed-radius compression misses. A shared archive retains up to 150 distinct contact patterns. Restarts include scattered and paired-circle seeds, rotations and reflections of nearby groups, partial rebuilding, relocating single pieces, orientation flips, and several perturbation scales. These searches run sequentially inside the existing worker. Only independently validated improvements replace the displayed best; the extra exploration does not require additional controls.

Symmetric or constrained fan searches retain the seeded fan-space basin hopping: small nudges, focused group moves, temporary expansion, radial exchanges, and moves between archived arrangements. The local solve increases constraint penalties to close overlaps. Contacts can change nonsmoothly, so neither search is a certificate of optimality. The [basin-hopping reference](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.basinhopping.html) describes the local-minimization / Metropolis approach.

Both **Tighten** and **Relax** accept time budgets from 1 to **600 seconds (10 minutes)**. The drawer shows elapsed and remaining time, and Stop terminates the worker immediately while retaining its last reported best result. **Continue search** restores Relax's last reported optimizer state, archives, and random sequence, instead of repeating the beginning. Changing the seed or movement constraints starts fresh; keeping/reverting/loading an arrangement clears that in-memory search history. Saved snapshots retain editor settings, not the optimizer checkpoint. The time limit is enforced in the worker as well as the controls and snapshot schema. Existing snapshots remain compatible.

**Contacts** in the canvas toolbar shows near contacts (circle markers), penetration (crosses), and proximity to the enclosing circle (squares). The minimum signed pair gap appears below the canvas. Inspector → Diagnostics lists pair gaps within 0.02 and every shape's circle clearance in unit radii. Negative pair gaps measure the minimum translation needed to separate the shapes, even when their intersection area falls below the collision threshold. Measurements use analytic support functions rather than polygon sampling. Contact display and the symmetry setting are included in snapshots; older snapshots still load.

For a shared-tip fan like a three-lobed pinwheel: unlock θ, select the inner fan, set N to 3, orbit radius to 1, spread to 360°, and tilt θ to ±90°. Each semicircle then has a diameter endpoint at the fan origin. Rotation φ turns the group; changing the orbit opens or closes the central gap. More lobes may overlap, as the collision display will show.

For two opposing halves that slide along their shared diameter line: use N = 2, spread = 360°, θ = 90°, and vary the orbit between 0 and 1. At 0 they form a disk; at 1 their tips meet. Rotation φ turns the pair (φ = −15° gives an absolute normal θ of 75°). Enable **Hold this fan’s θ during search** to retain that alignment while allowing the outer fan's tilt to change. If θ is linked, holding any fan holds the shared tilt for all fans. Holds and search seeds are included in snapshots; older snapshots still load.

Coordinates use +Y up. Export follows the [puzzle contract](https://www.paradigm.xyz/puzzles/packing/about): an array of `{x, y, theta}` with the disk center at `(x, y)` and the curved half facing absolute `theta` radians. Angles are normalized to −π…π before rounding so subsequent normalization preserves the exported six-decimal values. By default, coordinates and angles are rounded to six decimals **before** rendering and measurement. Exactly 15 shapes are required by the puzzle; the editor allows up to 120 for exploration.

Inspector → **Full precision** displays and exports the unrounded coordinates retained in the fan parameters. The canvas, radius, collisions, JSON, and snapshot measurements all use that precision; the header and saved drawer label these results **unrounded**. This allows continuous research candidates to be inspected without silently changing their geometry. Their radius and collision status do not certify the six-decimal puzzle export. Turn the option off to inspect puzzle rounding. Starting Tighten or Relax returns to six-decimal geometry, which remains the acceptance criterion for search results. Existing snapshots retain their original six-decimal behavior.

Geometry lives independently in `src/packing/`. Intersections integrate circular arcs and clipped diameters analytically using Green's theorem. Borderline contacts are checked again using the published validator's 4,096-vertex inscribed semicircle polygons; an area-deficit bound avoids polygon clipping for unambiguous cases. Hatching marks pairs exceeding the validator's 1e−6 area tolerance. Enclosure uses an incremental point-circle solve refined with analytic farthest points; the displayed radius encloses every arc and diagnostics report its numerical excess bound. Radius readouts show nine decimals so improvements below one millionth remain visible. There is no automatic submission.

Run these commands from the repository root:

- `bun run dev:paradigm-puzzles` starts development at `http://127.0.0.1:4447`.
- `bun run build:paradigm-puzzles` builds the app into `apps/paradigm-puzzles/dist`.
- `bun run start:paradigm-puzzles` previews that build on port 4447.
- `bun run deploy:paradigm-puzzles:dry` validates the Cloudflare deployment locally.
- `bun run deploy:paradigm-puzzles` publishes to `paradigm-puzzles.rorz.io`.

The app participates in the root `check`, `build`, and `verify` commands.

For a reproducible search outside the browser, export Inspector → Scene JSON and run:

```sh
bun run search:paradigm-puzzles /absolute/path/scene.json /absolute/path/run-42 600 42
```

The final arguments are seconds and seed. An optional fifth argument caps optimizer iterations, making comparisons independent of machine speed when the time budget is sufficient. The command writes `.scene.json`, `.placements.json`, `.report.json`, and `.checkpoint.json` files under the output prefix. It uses the same solver and validation as the editor, and does not submit anything to the leaderboard.
