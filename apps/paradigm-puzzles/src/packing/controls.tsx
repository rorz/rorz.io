import { type ChangeEvent, type KeyboardEvent, type ReactNode, useId, useState } from "react";

const Button = ({
  children,
  disabled = false,
  onClick,
  title,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) => (
  <button
    className="border border-black bg-white px-3 py-1 text-xs hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-30"
    disabled={disabled}
    onClick={onClick}
    title={title}
    type="button"
  >
    {children}
  </button>
);

const Toggle = ({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange(event.currentTarget.checked);
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs">
      <input
        checked={checked}
        className="size-3.5 accent-black"
        onChange={handleChange}
        type="checkbox"
      />
      {label}
    </label>
  );
};

type NumberControlProps = {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  unit?: string;
  value: number;
};
const NumberControl = ({
  label,
  max,
  min,
  onChange,
  step = 1,
  unit = "",
  value,
}: NumberControlProps) => {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const commit = () => {
    const number = Number(draft);
    if (draft.trim() && Number.isFinite(number)) {
      onChange(Math.min(max, Math.max(min, number)));
    }
    setFocused(false);
  };
  const edit = (event: ChangeEvent<HTMLInputElement>) => setDraft(event.currentTarget.value);
  const focus = () => {
    setDraft(String(value));
    setFocused(true);
  };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };
  const slide = (event: ChangeEvent<HTMLInputElement>) =>
    onChange(Number(event.currentTarget.value));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs" htmlFor={id}>
          {label}
        </label>
        <div className="flex items-center gap-1 font-mono text-xs">
          <input
            className="w-20 border border-black bg-white px-1 py-0.5 text-right focus:outline-2 focus:outline-black"
            id={id}
            max={max}
            min={min}
            onBlur={commit}
            onChange={edit}
            onFocus={focus}
            onKeyDown={keyDown}
            step={step}
            type="number"
            value={focused ? draft : value}
          />
          <span className="w-3">{unit}</span>
        </div>
      </div>
      <input
        aria-label={`${label} slider`}
        className="block h-3 w-full cursor-ew-resize appearance-none bg-transparent accent-black [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:h-px [&::-moz-range-track]:bg-black [&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:bg-white"
        max={max}
        min={min}
        onChange={slide}
        step={step}
        type="range"
        value={value}
      />
    </div>
  );
};

export { Button, NumberControl, Toggle };
