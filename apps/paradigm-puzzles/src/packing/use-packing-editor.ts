import { useState } from "react";
import type { Display, Viewport } from "./draw.ts";
import type { EditorSettings, InspectorTab, Snapshot } from "./editor-settings.ts";
import { initialScene, makeFan, type Point, updateFan } from "./model.ts";
import { defaultTightenOptions } from "./search-space.ts";
import { captureSnapshot } from "./snapshots.ts";
import { useScene } from "./use-scene.ts";
import { useSnapshots } from "./use-snapshots.ts";
import { useTighten } from "./use-tighten.ts";

const usePackingEditor = () => {
  const history = useScene();
  const library = useSnapshots();
  const search = useTighten();
  const [selectedId, select] = useState("1");
  const [inspector, setInspector] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("placements");
  const [camera, setCamera] = useState<Viewport | null>(null);
  const [options, setOptions] = useState(defaultTightenOptions);
  const [drawer, setDrawer] = useState<"saved" | "tighten" | null>(null);
  const [pendingSave, setPendingSave] = useState<EditorSettings | null>(null);
  const [display, setDisplay] = useState<Display>({
    circle: true,
    grid: true,
    guides: false,
    labels: false,
  });
  const scene = search.result?.best.scene ?? history.scene;
  const preview = search.result !== null;
  const selected = scene.fans.find((fan) => fan.id === selectedId) ?? scene.fans[0] ?? makeFan("1");
  const reset = () => {
    history.change(initialScene(), true);
    select("1");
    setCamera(null);
  };
  const toggleInspector = () => setInspector(!inspector);
  const moveFan = (id: string, point: Point) => history.change(updateFan(scene, id, point));
  const openSave = () =>
    setPendingSave(
      structuredClone({
        camera,
        display,
        inspector,
        inspectorTab,
        scene,
        selectedId: selected.id,
        tighten: options,
      }),
    );
  const closeSave = () => setPendingSave(null);
  const save = (name: string) => {
    if (pendingSave && library.add(captureSnapshot(name, pendingSave))) {
      closeSave();
      setDrawer("saved");
    }
  };
  const load = (snapshot: Snapshot) => {
    search.discard();
    const settings = structuredClone(snapshot.settings);
    history.change(settings.scene, true);
    setCamera(settings.camera);
    setDisplay(settings.display);
    setInspector(settings.inspector);
    setInspectorTab(settings.inspectorTab);
    setOptions(settings.tighten);
    select(settings.selectedId);
    setDrawer(null);
  };
  const startSearch = () => search.start(scene, options);
  const keepSearch = () => {
    if (search.result && !search.running && search.result.best.overlaps === 0) {
      history.change(search.result.best.scene, true);
      search.discard();
    }
  };
  const closeDrawer = () => setDrawer(null);
  const openSaved = () => setDrawer("saved");
  const openTighten = () => setDrawer("tighten");
  return {
    camera,
    closeDrawer,
    closeSave,
    display,
    drawer,
    history,
    inspector,
    inspectorTab,
    keepSearch,
    library,
    load,
    moveFan,
    openSave,
    openSaved,
    openTighten,
    options,
    pendingSave,
    preview,
    reset,
    save,
    scene,
    search,
    select,
    selected,
    setCamera,
    setDisplay,
    setInspectorTab,
    setOptions,
    startSearch,
    toggleInspector,
  };
};

export { usePackingEditor };
