import { Button, NumberControl, Toggle } from "./controls.tsx";
import { Drawer } from "./drawer.tsx";
import type { Scene } from "./model.ts";
import { canResumeRelax } from "./relax-checkpoint.ts";
import { symmetryIssue } from "./relax-groups.ts";
import { MAX_SEARCH_SECONDS, type TightenOptions } from "./search-space.ts";
import type { SearchUpdate } from "./tighten.ts";

type OptionField = Exclude<keyof TightenOptions, "seconds" | "seed" | "threefold">;
const SearchToggle = ({
  field,
  label,
  options,
  setOptions,
}: {
  field: OptionField;
  label: string;
  options: TightenOptions;
  setOptions: (options: TightenOptions) => void;
}) => {
  const change = (value: boolean) =>
    setOptions({
      ...options,
      [field]: value,
    });
  return <Toggle checked={options[field]} label={label} onChange={change} />;
};
type TightenDrawerProps = {
  error: string;
  mode: "tighten" | "relax";
  scene: Scene;
  onClose: () => void;
  onDiscard: () => void;
  onKeep: () => void;
  onStart: () => void;
  onStop: () => void;
  options: TightenOptions;
  overlaps: number;
  result: SearchUpdate | null;
  running: boolean;
  setOptions: (options: TightenOptions) => void;
};
const TightenDrawer = ({
  error,
  mode,
  scene,
  onClose,
  onDiscard,
  onKeep,
  onStart,
  onStop,
  options,
  overlaps,
  result,
  running,
  setOptions,
}: TightenDrawerProps) => {
  const relaxing = mode === "relax";
  const continuing = relaxing && canResumeRelax(result?.checkpoint, scene, options);
  const threefold = options.threefold ?? true;
  const symmetry = (value: boolean) =>
    setOptions({
      ...options,
      threefold: value,
    });
  const issue = relaxing
    ? symmetryIssue(scene, threefold) ||
      (overlaps > 0 ? "Resolve overlaps with Tighten before starting Relax." : "")
    : "";
  const duration = (seconds: number) =>
    setOptions({
      ...options,
      seconds,
    });
  const seed = (value: number) =>
    setOptions({
      ...options,
      seed: Math.round(value),
    });
  const enabled =
    options.orbit ||
    options.phase ||
    options.tilt ||
    (!relaxing && (options.origins || options.spread));
  let status = result?.reason ?? "Ready";
  if (running) {
    status = result?.reason ?? "Searching…";
  }
  if (!running && result && !result.finished) {
    status = "Stopped";
  }
  return (
    <Drawer onClose={onClose} title={relaxing ? "Relax" : "Tighten"}>
      <div className="space-y-4 p-3">
        <p className="text-xs leading-relaxed">
          {relaxing
            ? "Compress, shake, and settle groups to explore different arrangements. The preview retains your best valid packing. Keep result saves the new groups as separate fan layers."
            : "Search nearby fan settings for a smaller enclosing circle. Restarts explore beyond local stalls; counts and held angles are preserved."}{" "}
          Search evaluates coordinates rounded to six decimals.
        </p>
        {!result && overlaps > 0 && !relaxing ? (
          <p className="border border-black p-2 text-xs leading-relaxed">
            The starting arrangement has {overlaps} overlap pairs. Search repairs these first, which
            can increase R.
          </p>
        ) : null}
        <fieldset className="space-y-3 disabled:opacity-50" disabled={running}>
          <legend className="mb-3 text-xs font-bold">Allow changes to</legend>
          {relaxing ? (
            <>
              <Toggle checked={threefold} label="Lock threefold symmetry" onChange={symmetry} />
              <p className="text-xs leading-relaxed">
                {threefold
                  ? "Each triplet repeats every 120°. A 12 + 3 arrangement becomes five independent triplets."
                  : "Each semicircle moves independently. The total count stays fixed."}{" "}
                Linked and held θ settings are respected.
              </p>
            </>
          ) : null}
          <SearchToggle
            field="orbit"
            label="Orbit radii"
            options={options}
            setOptions={setOptions}
          />
          <SearchToggle
            field="phase"
            label="Fan rotations / φ"
            options={options}
            setOptions={setOptions}
          />
          <SearchToggle
            field="tilt"
            label="Semicircle tilts / θ"
            options={options}
            setOptions={setOptions}
          />
          {relaxing ? null : (
            <SearchToggle
              field="origins"
              label="Fan origins / X, Y"
              options={options}
              setOptions={setOptions}
            />
          )}
          {relaxing ? null : (
            <SearchToggle
              field="spread"
              label="Fan spreads"
              options={options}
              setOptions={setOptions}
            />
          )}
          <NumberControl
            label="Time budget"
            max={MAX_SEARCH_SECONDS}
            min={1}
            onChange={duration}
            unit="s"
            value={options.seconds}
          />
          <p className="text-xs opacity-60">Up to 600 seconds (10 minutes). Stop at any time.</p>
          <NumberControl
            label="Search seed"
            max={999_999}
            min={1}
            onChange={seed}
            value={options.seed ?? 42}
          />
        </fieldset>
        {issue ? (
          <p className="border border-black p-2 text-xs" role="status">
            {issue}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {running ? (
            <Button onClick={onStop}>Stop</Button>
          ) : (
            <Button disabled={!enabled || Boolean(issue)} onClick={onStart}>
              {continuing
                ? "Continue search"
                : result
                  ? "Search again"
                  : relaxing
                    ? "Start relaxing"
                    : "Start tightening"}
            </Button>
          )}
          {result ? (
            <>
              <Button disabled={running || result.best.overlaps > 0} onClick={onKeep}>
                Keep result
              </Button>
              <Button onClick={onDiscard}>Revert</Button>
            </>
          ) : null}
        </div>
        <p aria-live="polite" className="border-y border-black py-2 font-mono text-xs">
          {status}
        </p>
        {result ? (
          <div className="space-y-2 font-mono text-xs">
            <p>
              Start: R {result.initial.radius.toFixed(9)} · {result.initial.overlaps} overlap pairs
            </p>
            <p>
              {result.best.overlaps === 0 ? "Best valid" : "Repair candidate"}: R{" "}
              {result.best.radius.toFixed(9)} · {result.best.overlaps} overlap pairs
            </p>
            <p className="font-sans leading-relaxed">
              {result.initial.overlaps > 0
                ? "The start contained overlaps. A larger valid radius is an overlap repair, not a radius improvement."
                : "The start was collision-free. The best radius cannot increase."}
            </p>
            <p>
              {result.evaluations} evaluations{relaxing ? " total" : ""}
            </p>
            <p>
              {(result.elapsed / 1000).toFixed(1)} seconds{relaxing ? " this run" : ""} ·{" "}
              {result.restarts} restarts · seed {result.seed}
            </p>
            {running ? (
              <p>
                {Math.max(0, Math.ceil(options.seconds - result.elapsed / 1000))} seconds remaining
              </p>
            ) : null}
            <p className="font-sans">
              Preview only. Keep commits one undoable edit; Revert restores your arrangement.
            </p>
            {result.best.overlaps > 0 && !running ? (
              <p>No collision-free result yet. Adjust the settings or search again.</p>
            ) : null}
          </div>
        ) : null}
        {error ? (
          <p className="text-xs" role="alert">
            {error}
          </p>
        ) : null}
        <p className="text-xs leading-relaxed opacity-60">
          The preview keeps the best result found. Trials can temporarily overlap or expand to
          escape a stall; they never replace a better valid result.{" "}
          {relaxing
            ? "Continue search retains explored arrangements and the current search progress. Changing the seed or constraints starts a new search."
            : "The same starting settings and seed repeat the search sequence; timing affects how far it gets."}{" "}
          Global optimality is not guaranteed.
        </p>
      </div>
    </Drawer>
  );
};

export { TightenDrawer };
