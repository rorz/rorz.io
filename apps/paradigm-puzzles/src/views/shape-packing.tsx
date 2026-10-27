import { useMemo } from "react";
import { PackingCanvas } from "../packing/canvas.tsx";
import { nearbyContacts } from "../packing/clearance.ts";
import { Button } from "../packing/controls.tsx";
import { DebugPanel } from "../packing/debug-panel.tsx";
import { enclosingCircle } from "../packing/enclosure.ts";
import { FanPanel } from "../packing/fan-panel.tsx";
import { generateShapes } from "../packing/model.ts";
import { findCollisions } from "../packing/overlap.ts";
import { SaveDialog } from "../packing/save-dialog.tsx";
import { SavedDrawer } from "../packing/saved-drawer.tsx";
import { TightenDrawer } from "../packing/tighten-drawer.tsx";
import { usePackingEditor } from "../packing/use-packing-editor.ts";

const PUZZLE_COUNT = 15;
const ShapePackingView = () => {
  const editor = usePackingEditor();
  const { scene, history, search, library, preview } = editor;
  const fullPrecision = editor.display.fullPrecision === true;
  const shapes = useMemo(
    () => generateShapes(scene, fullPrecision),
    [
      scene,
      fullPrecision,
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
  const showContacts =
    editor.display.contacts || (editor.inspector && editor.inspectorTab === "diagnostics");
  const contacts = useMemo(
    () => (showContacts ? nearbyContacts(shapes) : []),
    [
      shapes,
      showContacts,
    ],
  );
  return (
    <main
      className={`flex min-h-dvh flex-col bg-white font-sans text-black scheme-light lg:h-dvh ${editor.drawer ? "lg:pr-80" : ""}`}
    >
      <title>Semicircle packing</title>
      <header className="flex flex-wrap items-center justify-between gap-3 bg-black px-3 py-2 text-white">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-sm font-bold">Semicircle packing</h1>
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
              {circle.radius.toFixed(9)}
            </strong>
            {fullPrecision ? " · unrounded" : ""}
          </p>
          <p>
            N <strong className="text-base font-normal">{shapes.length}</strong>
            <span className="opacity-50"> / {PUZZLE_COUNT}</span>
          </p>
          <p className={collisions.length > 0 ? "bg-black px-2 py-1 text-white" : ""}>
            {collisions.length > 0 ? `${collisions.length} overlap pairs` : "No overlaps"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button disabled={search.running} onClick={editor.openSave}>
            Save…
          </Button>
          <Button onClick={editor.openSaved}>Saved ({library.items.length})</Button>
          <Button
            disabled={preview && search.result?.mode !== "tighten"}
            onClick={editor.openTighten}
          >
            {search.running && search.result?.mode === "tighten" ? "Tightening…" : "Tighten…"}
          </Button>
          <Button disabled={preview && search.result?.mode !== "relax"} onClick={editor.openRelax}>
            {search.running && search.result?.mode === "relax" ? "Relaxing…" : "Relax…"}
          </Button>
          <Button disabled={preview || !history.canUndo} onClick={history.undo}>
            Undo
          </Button>
          <Button disabled={preview || !history.canRedo} onClick={history.redo}>
            Redo
          </Button>
          <Button disabled={preview} onClick={editor.reset}>
            Reset
          </Button>
          <Button onClick={editor.toggleInspector}>
            {editor.inspector ? "Hide inspector" : "Show inspector"}
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <fieldset aria-label="Arrangement controls" className="contents" disabled={preview}>
          <FanPanel
            change={history.change}
            display={editor.display}
            scene={scene}
            select={editor.select}
            selected={editor.selected}
            setDisplay={editor.setDisplay}
          />
        </fieldset>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PackingCanvas
            camera={editor.camera}
            circle={circle}
            collisions={collisions}
            contacts={contacts}
            display={editor.display}
            fans={scene.fans}
            moveFan={editor.moveFan}
            readOnly={preview}
            selected={editor.selected.id}
            selectFan={editor.select}
            setCamera={editor.setCamera}
            setContacts={editor.setContacts}
            shapes={shapes}
          />
          {editor.inspector ? (
            <DebugPanel
              circle={circle}
              collisions={collisions}
              contacts={contacts}
              fullPrecision={fullPrecision}
              precisionLocked={preview}
              scene={scene}
              select={editor.select}
              setFullPrecision={editor.setFullPrecision}
              setTab={editor.setInspectorTab}
              shapes={shapes}
              tab={editor.inspectorTab}
            />
          ) : null}
        </div>
      </div>
      {editor.drawer === "saved" ? (
        <SavedDrawer
          error={library.error}
          items={library.items}
          onClose={editor.closeDrawer}
          onLoad={editor.load}
          onRemove={library.remove}
          onSave={editor.openSave}
          onUndoRemove={library.undoRemove}
          removedName={library.removed?.name}
          savingDisabled={search.running}
        />
      ) : null}
      {editor.drawer === "tighten" || editor.drawer === "relax" ? (
        <TightenDrawer
          error={search.error}
          mode={editor.drawer}
          onClose={editor.closeDrawer}
          onDiscard={search.discard}
          onKeep={editor.keepSearch}
          onStart={editor.startSearch}
          onStop={search.stop}
          options={editor.options}
          overlaps={
            fullPrecision ? findCollisions(generateShapes(scene)).length : collisions.length
          }
          result={search.result}
          running={search.running}
          scene={scene}
          setOptions={editor.setOptions}
        />
      ) : null}
      {editor.pendingSave ? (
        <SaveDialog
          defaultName={`Arrangement ${library.items.length + 1}`}
          error={library.error}
          onClose={editor.closeSave}
          onSave={editor.save}
        />
      ) : null}
    </main>
  );
};

export { ShapePackingView };
