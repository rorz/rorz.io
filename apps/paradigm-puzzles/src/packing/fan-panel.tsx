// biome-ignore-all lint/style/noMagicNumbers: editor ranges are shown directly beside their controls.
import type { MouseEvent } from "react";
import { Button, NumberControl, Toggle } from "./controls.tsx";
import type { Display } from "./draw.ts";
import {
  type Fan,
  MAX_SHAPES,
  makeFan,
  removeLastSemicircle,
  type Scene,
  updateFan,
} from "./model.ts";

type Property = "count" | "orbit" | "phase" | "spread" | "tilt" | "x" | "y";
type PropertySpec = {
  key: Property;
  label: string;
  max: number;
  min: number;
  step: number;
  unit?: string;
};
const properties: PropertySpec[] = [
  {
    key: "count",
    label: "Semicircles / N",
    max: MAX_SHAPES,
    min: 1,
    step: 1,
  },
  {
    key: "orbit",
    label: "Orbit radius",
    max: 10,
    min: 0,
    step: 0.001,
  },
  {
    key: "phase",
    label: "Rotation / φ",
    max: 360,
    min: -180,
    step: 0.1,
    unit: "°",
  },
  {
    key: "spread",
    label: "Spread",
    max: 360,
    min: 0,
    step: 0.1,
    unit: "°",
  },
  {
    key: "tilt",
    label: "Tilt / θ",
    max: 180,
    min: -180,
    step: 0.1,
    unit: "°",
  },
];
const origins: PropertySpec[] = [
  {
    key: "x",
    label: "Center X",
    max: 20,
    min: -20,
    step: 0.001,
  },
  {
    key: "y",
    label: "Center Y",
    max: 20,
    min: -20,
    step: 0.001,
  },
];
const FanProperty = ({
  fan,
  maxCount,
  spec,
  update,
}: {
  fan: Fan;
  maxCount: number;
  spec: PropertySpec;
  update: (patch: Partial<Fan>) => void;
}) => {
  const change = (value: number) =>
    update({
      [spec.key]: spec.key === "count" ? Math.round(value) : value,
    });
  const removeOne = () => update(removeLastSemicircle(fan));
  const control = (
    <NumberControl
      label={spec.label}
      max={spec.key === "count" ? maxCount : spec.max}
      min={spec.min}
      onChange={change}
      step={spec.step}
      unit={spec.unit ?? ""}
      value={fan[spec.key]}
    />
  );
  return spec.key === "count" ? (
    <div className="space-y-2">
      {control}
      <Button disabled={fan.count <= 1} onClick={removeOne}>
        Remove last, keep positions
      </Button>
      <p className="text-xs leading-relaxed opacity-60">
        Changing N redistributes the fan. Removing the last shape preserves the others and adjusts
        the spread.
      </p>
    </div>
  ) : (
    control
  );
};
const DisplayToggle = ({
  display,
  field,
  label,
  setDisplay,
}: {
  display: Display;
  field: keyof Display;
  label: string;
  setDisplay: (display: Display) => void;
}) => {
  const change = (value: boolean) =>
    setDisplay({
      ...display,
      [field]: value,
    });
  return <Toggle checked={display[field] ?? false} label={label} onChange={change} />;
};
type FanPanelProps = {
  change: (scene: Scene) => void;
  display: Display;
  scene: Scene;
  selected: Fan;
  select: (id: string) => void;
  setDisplay: (display: Display) => void;
};
const FanPanel = ({ change, display, scene, selected, select, setDisplay }: FanPanelProps) => {
  const total = scene.fans.reduce((sum, fan) => sum + fan.count, 0);
  const maxCount = MAX_SHAPES - total + selected.count;
  const update = (patch: Partial<Fan>) => change(updateFan(scene, selected.id, patch));
  const holdTilt = (held: boolean) =>
    update({
      holdTilt: held,
    });
  const add = () => {
    const id = String(Math.max(...scene.fans.map((fan) => Number(fan.id))) + 1);
    change({
      ...scene,
      fans: [
        ...scene.fans,
        {
          ...makeFan(id),
          tilt: selected.tilt,
        },
      ],
    });
    select(id);
  };
  const remove = () =>
    change({
      ...scene,
      fans: scene.fans.filter((fan) => fan.id !== selected.id),
    });
  const pick = (event: MouseEvent<HTMLButtonElement>) => select(event.currentTarget.value);
  const link = (linked: boolean) =>
    change({
      fans: scene.fans.map((fan) =>
        linked
          ? {
              ...fan,
              tilt: selected.tilt,
            }
          : fan,
      ),
      linked,
    });
  return (
    <aside
      aria-label="Fan controls"
      className="w-full shrink-0 border-b border-black lg:w-72 lg:overflow-y-auto lg:border-r lg:border-b-0"
    >
      <div className="flex items-center justify-between border-b border-black px-3 py-2">
        <h2 className="font-mono text-xs font-bold">FAN LAYERS</h2>
        <Button disabled={total > MAX_SHAPES - 3} onClick={add}>
          + Add
        </Button>
      </div>
      <fieldset aria-label="Select fan" className="border-b border-black">
        {scene.fans.map((fan) => (
          <button
            aria-pressed={fan.id === selected.id}
            className={`flex w-full items-center justify-between border-b border-black/20 px-3 py-2 text-left text-xs last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-4 ${fan.id === selected.id ? "bg-black text-white focus-visible:outline-white" : "bg-white text-black focus-visible:outline-black"}`}
            key={fan.id}
            onClick={pick}
            type="button"
            value={fan.id}
          >
            <span>Fan {fan.id}</span>
            <span className="font-mono">{fan.count} × r1</span>
          </button>
        ))}
      </fieldset>
      <div className="space-y-4 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold">Fan {selected.id} properties</h3>
          <button
            className="text-xs underline underline-offset-2 disabled:opacity-30"
            disabled={scene.fans.length === 1}
            onClick={remove}
            type="button"
          >
            Remove
          </button>
        </div>
        {properties.map((spec) => (
          <FanProperty
            fan={selected}
            key={spec.key}
            maxCount={maxCount}
            spec={spec}
            update={update}
          />
        ))}
        <Toggle checked={scene.linked} label="Lock θ across all fans" onChange={link} />
        <Toggle
          checked={selected.holdTilt ?? false}
          label="Hold this fan’s θ during search"
          onChange={holdTilt}
        />
        {scene.linked && scene.fans.some((fan) => fan.holdTilt) ? (
          <p className="text-xs">
            Shared θ is held for all fans. Unlink θ to adjust them independently.
          </p>
        ) : null}
        <p className="text-xs leading-relaxed opacity-60">
          θ tilts each curved half from its radial direction. φ rotates the whole fan. A 360° spread
          closes the ring.
        </p>
      </div>
      <fieldset className="space-y-4 border-t border-black p-3">
        <legend className="px-1 text-xs font-bold">Fan origin</legend>
        {origins.map((spec) => (
          <FanProperty
            fan={selected}
            key={spec.key}
            maxCount={maxCount}
            spec={spec}
            update={update}
          />
        ))}
      </fieldset>
      <fieldset className="space-y-3 border-t border-black p-3">
        <legend className="px-1 text-xs font-bold">Display</legend>
        <div className="grid grid-cols-2 gap-3">
          <DisplayToggle
            display={display}
            field="circle"
            label="Enclosing circle"
            setDisplay={setDisplay}
          />
          <DisplayToggle display={display} field="grid" label="Unit grid" setDisplay={setDisplay} />
          <DisplayToggle
            display={display}
            field="guides"
            label="Fan guides"
            setDisplay={setDisplay}
          />
          <DisplayToggle
            display={display}
            field="labels"
            label="Shape IDs"
            setDisplay={setDisplay}
          />
        </div>
      </fieldset>
    </aside>
  );
};

export { FanPanel };
