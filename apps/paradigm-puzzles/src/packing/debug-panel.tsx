import { type MouseEvent, useState } from "react";
import { Button } from "./controls.tsx";
import type { InspectorTab } from "./editor-settings.ts";
import { type Circle, type Collision, exportPlacements, type Scene, type Shape } from "./model.ts";

type DebugPanelProps = {
  circle: Circle;
  collisions: Collision[];
  scene: Scene;
  select: (id: string) => void;
  shapes: Shape[];
  tab: InspectorTab;
  setTab: (tab: InspectorTab) => void;
};
const DebugPanel = ({
  circle,
  collisions,
  scene,
  select,
  shapes,
  tab,
  setTab,
}: DebugPanelProps) => {
  const [notice, setNotice] = useState<{
    json: string;
    message: string;
  } | null>(null);
  const data = tab === "placements" ? exportPlacements(shapes) : scene;
  const json = JSON.stringify(data, null, 2);
  const message = notice?.json === json ? notice.message : "";
  const report = (text: string) =>
    setNotice({
      json,
      message: text,
    });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      report("Copied.");
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      report(`Copy failed: ${reason}. Select the JSON and copy it manually.`);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          json,
        ],
        {
          type: "application/json",
        },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = tab === "placements" ? "packing.json" : "packing-scene.json";
    link.click();
    URL.revokeObjectURL(url);
    report("Downloaded.");
  };
  const pickTab = (event: MouseEvent<HTMLButtonElement>) => {
    const value = event.currentTarget.value;
    if (value === "placements" || value === "scene" || value === "diagnostics") {
      setTab(value);
    }
    setNotice(null);
  };
  const pickFan = (event: MouseEvent<HTMLButtonElement>) => select(event.currentTarget.value);
  return (
    <section
      aria-label="Debug inspector"
      className="flex h-64 shrink-0 flex-col border-t border-black"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-black p-2">
        <fieldset aria-label="Inspector views" className="flex gap-1">
          {[
            "placements",
            "scene",
            "diagnostics",
          ].map((name) => (
            <button
              aria-pressed={tab === name}
              className={`border border-black px-2 py-1 text-xs capitalize ${tab === name ? "bg-black text-white" : "bg-white text-black"}`}
              key={name}
              onClick={pickTab}
              type="button"
              value={name}
            >
              {name}
            </button>
          ))}
        </fieldset>
        {tab !== "diagnostics" && (
          <div className="flex items-center gap-2">
            <span aria-live="polite" className="text-xs">
              {message}
            </span>
            <Button onClick={copy}>Copy JSON</Button>
            <Button onClick={download}>Download</Button>
          </div>
        )}
      </div>
      {tab === "diagnostics" ? (
        <div className="overflow-y-auto p-3 font-mono text-xs">
          <p>
            Circle center: ({circle.x.toFixed(6)}, {circle.y.toFixed(6)})
          </p>
          <p>Radius excess bound: {circle.error.toExponential(2)}</p>
          <p className="mt-2">
            {collisions.length} intersecting pairs above 1e−6 area. Select a pair to inspect its
            first fan.
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {collisions.map((collision) => (
              <li key={`${collision.a}/${collision.b}`}>
                <button
                  className="underline underline-offset-2"
                  onClick={pickFan}
                  type="button"
                  value={collision.a.split(".")[0] ?? "1"}
                >
                  {collision.a} ↔ {collision.b} / area {collision.area.toFixed(8)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <p className="shrink-0 border-b border-black/20 px-3 py-1 text-xs opacity-60">
            {tab === "placements"
              ? "Puzzle format · x/y = diameter midpoint · θ = absolute radians · rounded to 6 decimals"
              : "Editor parameters · angles in degrees · coordinates in unit radii"}
          </p>
          <textarea
            aria-label={`${tab} JSON`}
            className="min-h-0 w-full flex-1 resize-none bg-white p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-black focus:ring-inset"
            readOnly={true}
            spellCheck={false}
            value={json}
          />
        </>
      )}
    </section>
  );
};

export { DebugPanel };
