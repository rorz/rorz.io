import { useMemo, useState } from "react";
import { PackingCanvas } from "../packing/canvas.tsx";
import { Button } from "../packing/controls.tsx";
import { DebugPanel } from "../packing/debug-panel.tsx";
import type { Display } from "../packing/draw.ts";
import { enclosingCircle } from "../packing/enclosure.ts";
import { FanPanel } from "../packing/fan-panel.tsx";
import { generateShapes, initialScene, makeFan, type Point, updateFan } from "../packing/model.ts";
import { findCollisions } from "../packing/overlap.ts";
import { useScene } from "../packing/use-scene.ts";

const PUZZLE_COUNT = 15;
const ShapePackingView = () => {
  const { scene, change, undo, redo, canUndo, canRedo } = useScene();
  const [selectedId, select] = useState("1");
  const [debug, setDebug] = useState(false);
  const [display, setDisplay] = useState<Display>({
    circle: true,
    grid: true,
    guides: false,
    labels: false,
  });
  const selected = scene.fans.find((fan) => fan.id === selectedId) ?? scene.fans[0] ?? makeFan("1");
  const shapes = useMemo(
    () => generateShapes(scene),
    [
      scene,
    ],
  );
  const circle = useMemo(
    () => enclosingCircle(shapes),
    [
      shapes,
    ],
  );
  const collisions = useMemo(
    () => findCollisions(shapes),
    [
      shapes,
    ],
  );
  const reset = () => {
    change(initialScene());
    select("1");
  };
  const toggleDebug = () => setDebug(!debug);
  const moveFan = (id: string, point: Point) => change(updateFan(scene, id, point));
  return (
    <main className="flex min-h-dvh flex-col bg-white font-sans text-black scheme-light lg:h-dvh">
      <title>Shape Packing · Paradigm Puzzles</title>
      <header className="flex flex-wrap items-center justify-between gap-3 bg-black px-3 py-2 text-white">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-5 place-items-center border border-white font-mono text-xs"
          >
            ◐
          </span>
          <h1 className="font-mono text-sm font-bold">Shape Packing</h1>
          <span className="hidden font-mono text-xs opacity-60 sm:inline">/ paradigm-puzzles</span>
        </div>
        <a
          className="text-xs underline underline-offset-2"
          href="https://www.paradigm.xyz/puzzles/packing/about"
          rel="noreferrer"
          target="_blank"
        >
          Puzzle brief ↗
        </a>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-xs">
          <p>
            R{" "}
            <strong className="text-base font-normal tabular-nums">
              {circle.radius.toFixed(6)}
            </strong>
          </p>
          <p>
            N <strong className="text-base font-normal">{shapes.length}</strong>
            <span className="opacity-50"> / {PUZZLE_COUNT}</span>
          </p>
          <p className={collisions.length > 0 ? "bg-black px-2 py-1 text-white" : ""}>
            {collisions.length > 0 ? `${collisions.length} overlap pairs` : "No overlaps"}
          </p>
        </div>
        <div className="flex gap-1">
          <Button disabled={!canUndo} onClick={undo}>
            Undo
          </Button>
          <Button disabled={!canRedo} onClick={redo}>
            Redo
          </Button>
          <Button onClick={reset}>Reset</Button>
          <Button onClick={toggleDebug}>{debug ? "Hide inspector" : "Show inspector"}</Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <FanPanel
          change={change}
          display={display}
          scene={scene}
          select={select}
          selected={selected}
          setDisplay={setDisplay}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PackingCanvas
            circle={circle}
            collisions={collisions}
            display={display}
            fans={scene.fans}
            moveFan={moveFan}
            selected={selected.id}
            selectFan={select}
            shapes={shapes}
          />
          {debug ? (
            <DebugPanel
              circle={circle}
              collisions={collisions}
              scene={scene}
              select={select}
              shapes={shapes}
            />
          ) : null}
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-black px-3 py-1.5 font-mono text-xs">
        <p>
          {shapes.length === PUZZLE_COUNT
            ? "15 unit semicircles"
            : `Exploration mode · ${PUZZLE_COUNT} shapes required for the puzzle`}
        </p>
        <p>Analytic intersections · area tolerance 1e−6</p>
      </footer>
    </main>
  );
};

export { ShapePackingView };
