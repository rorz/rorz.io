import type { Display, Viewport } from "./draw.ts";
import type { Scene } from "./model.ts";
import type { TightenOptions } from "./search-space.ts";

type InspectorTab = "placements" | "scene" | "diagnostics";
type EditorSettings = {
  scene: Scene;
  camera: Viewport | null;
  display: Display;
  inspector: boolean;
  inspectorTab: InspectorTab;
  selectedId: string;
  tighten: TightenOptions;
};
type Snapshot = {
  id: string;
  name: string;
  createdAt: string;
  settings: EditorSettings;
  radius: number;
  overlaps: number;
};

export type { EditorSettings, InspectorTab, Snapshot };
