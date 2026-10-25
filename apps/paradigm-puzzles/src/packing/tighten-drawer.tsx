import { Button, NumberControl, Toggle } from "./controls.tsx";
import { Drawer } from "./drawer.tsx";
import type { TightenOptions } from "./search-space.ts";
import type { SearchUpdate } from "./tighten.ts";

type OptionField = Exclude<keyof TightenOptions, "seconds" | "seed">;
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
    options.orbit || options.phase || options.tilt || options.origins || options.spread;
  let status = result?.reason ?? "Ready";
  if (running) {
    status = result?.reason ?? "Searching…";
  }
  if (!running && result && !result.finished) {
    status = "Stopped";
  }
  return (
    <Drawer onClose={onClose} title="Tighten">
      <div className="space-y-4 p-3">
        <p className="text-xs leading-relaxed">
          Search nearby fan settings for a smaller enclosing circle. Restarts explore beyond local
          stalls; counts and held angles are preserved.
        </p>
        {!result && overlaps > 0 ? (
          <p className="border border-black p-2 text-xs leading-relaxed">
            The starting arrangement has {overlaps} overlap pairs. Search repairs these first, which
            can increase R.
          </p>
        ) : null}
        <fieldset className="space-y-3 disabled:opacity-50" disabled={running}>
          <legend className="mb-3 text-xs font-bold">Allow changes to</legend>
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
          <SearchToggle
            field="origins"
            label="Fan origins / X, Y"
            options={options}
            setOptions={setOptions}
          />
          <SearchToggle
            field="spread"
            label="Fan spreads"
            options={options}
            setOptions={setOptions}
          />
          <NumberControl
            label="Time budget"
            max={60}
            min={1}
            onChange={duration}
            unit="s"
            value={options.seconds}
          />
          <NumberControl
            label="Search seed"
            max={999_999}
            min={1}
            onChange={seed}
            value={options.seed ?? 42}
          />
        </fieldset>
        <div className="flex flex-wrap gap-2">
          {running ? (
            <Button onClick={onStop}>Stop</Button>
          ) : (
            <Button disabled={!enabled} onClick={onStart}>
              {result ? "Search again" : "Start tightening"}
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
              Start: R {result.initial.radius.toFixed(6)} · {result.initial.overlaps} overlap pairs
            </p>
            <p>
              {result.best.overlaps === 0 ? "Best valid" : "Repair candidate"}: R{" "}
              {result.best.radius.toFixed(6)} · {result.best.overlaps} overlap pairs
            </p>
            <p className="font-sans leading-relaxed">
              {result.initial.overlaps > 0
                ? "The start contained overlaps. A larger valid radius is an overlap repair, not a radius improvement."
                : "The start was collision-free. The best radius cannot increase."}
            </p>
            <p>{result.evaluations} evaluations</p>
            <p>
              {(result.elapsed / 1000).toFixed(1)} seconds · {result.restarts} restarts · seed{" "}
              {result.seed}
            </p>
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
          escape a stall; they never replace a better valid result. The same starting settings and
          seed repeat the search sequence; timing affects how far it gets. Global optimality is not
          guaranteed.
        </p>
      </div>
    </Drawer>
  );
};

export { TightenDrawer };
