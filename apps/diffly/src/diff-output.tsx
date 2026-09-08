import { clsx } from "clsx";
import { type ChangeEventHandler, type KeyboardEvent, useState } from "react";
import { Tag } from "./tag.tsx";

type CopyState = "idle" | "copied" | "error";

const copyLabels: Record<CopyState, string> = {
  copied: "Copied",
  error: "Failed",
  idle: "Copy",
};
const copiedFeedbackMs = 1500;
const failedFeedbackMs = 2000;
const lineClass = "block min-h-5 px-3.5";

const CopyIcon = () => (
  <svg
    aria-hidden="true"
    className="size-4 flex-none"
    fill="currentColor"
    focusable="false"
    viewBox="0 0 256 256"
  >
    <path d="M216,36H88A12,12,0,0,0,76,48V76H48A12,12,0,0,0,36,88V216a12,12,0,0,0,12,12H176a12,12,0,0,0,12-12V188h28a12,12,0,0,0,12-12V48A12,12,0,0,0,216,36ZM164,204H60V100H164Zm40-40H188V88a12,12,0,0,0-12-12H100V60H204Z" />
  </svg>
);

const CopyButton = ({ diff }: { readonly diff: string }) => {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const copyDiff = async () => {
    if (!diff) {
      return;
    }

    try {
      await navigator.clipboard.writeText(diff);
      setCopyState("copied");
      globalThis.setTimeout(() => setCopyState("idle"), copiedFeedbackMs);
      // pokayoke-ignore: typescript/no-swallowed-errors -- Clipboard failures are shown in the button.
    } catch {
      setCopyState("error");
      globalThis.setTimeout(() => setCopyState("idle"), failedFeedbackMs);
    }
  };

  return (
    <button
      aria-label="Copy generated diff"
      className="inline-flex px-2 py-0.5 cursor-pointer items-center justify-center gap-1 rounded-sm border border-zinc-200 bg-zinc-100 text-xs/none font-bold text-zinc-950 hover:bg-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-200 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:hover:bg-zinc-800 max-md:min-w-20"
      disabled={!diff}
      onClick={copyDiff}
      type="button"
    >
      <CopyIcon />
      <span>{copyLabels[copyState]}</span>
    </button>
  );
};

const MetadataToggle = ({
  checked,
  onChange,
}: {
  readonly checked: boolean;
  readonly onChange: ChangeEventHandler<HTMLInputElement>;
}) => {
  const trackClass = clsx(
    "relative h-5 w-9 flex-none rounded-full border transition-colors",
    checked ? "border-green-400 bg-green-950" : "border-zinc-600 bg-zinc-900",
  );
  const knobClass = clsx(
    "absolute top-0.5 left-0.5 size-3.5 rounded-full transition",
    checked ? "translate-x-4 bg-green-300" : "translate-x-0 bg-zinc-400",
  );

  return (
    <label className="flex min-w-0 cursor-pointer items-center gap-2 rounded-full text-xs/none text-zinc-400 select-none focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-green-400">
      <input checked={checked} className="sr-only" onChange={onChange} type="checkbox" />
      <span aria-hidden="true" className={trackClass}>
        <span className={knobClass} />
      </span>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
        Include git apply metadata
      </span>
    </label>
  );
};

const getDiffLineClass = (line: string): string => {
  if (line.startsWith("@@")) {
    return clsx(lineClass, "bg-violet-950 text-violet-300");
  }

  if (line.startsWith("diff --git") || line.startsWith("--- ") || line.startsWith("+++ ")) {
    return clsx(lineClass, "text-zinc-400");
  }

  if (line.startsWith("+")) {
    return clsx(lineClass, "bg-green-950 text-green-200");
  }

  if (line.startsWith("-")) {
    return clsx(lineClass, "bg-red-950 text-red-200");
  }

  return clsx(lineClass, "text-zinc-300");
};

const selectDiffOutput = (event: KeyboardEvent<HTMLDivElement>) => {
  const isSelectAll =
    event.key.toLowerCase() === "a" && (event.metaKey || event.ctrlKey) && !event.altKey;
  const selection = globalThis.getSelection();

  if (!(isSelectAll && selection)) {
    return;
  }

  event.preventDefault();
  const range = document.createRange();
  range.selectNodeContents(event.currentTarget);
  selection.removeAllRanges();
  selection.addRange(range);
};

interface DiffOutputProps {
  readonly diff: string;
  readonly includeGitMetadata: boolean;
  readonly onMetadataChange: ChangeEventHandler<HTMLInputElement>;
}

const DiffOutput = ({ diff, includeGitMetadata, onMetadataChange }: DiffOutputProps) => {
  const diffOutputClass = clsx(
    "h-full w-full overflow-auto bg-zinc-950 font-mono text-sm leading-normal whitespace-pre select-text tab-2 focus:bg-zinc-900 focus:-outline-offset-2 focus:outline-green-400",
    diff ? "py-13 text-zinc-200" : "px-3.5 py-13 text-zinc-500",
  );

  return (
    <section aria-label="Generated diff" className="relative min-h-0 min-w-0 md:col-span-5">
      <div className="absolute inset-x-0 top-0 z-20 flex h-9.5 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-3 py-2 max-md:gap-2.5">
        <Tag inBar={true}>diff</Tag>
        <div className="flex min-w-0 items-center justify-end gap-3 max-md:gap-2">
          <MetadataToggle checked={includeGitMetadata} onChange={onMetadataChange} />
          <CopyButton diff={diff} />
        </div>
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: A read-only diff needs styled lines inside its selectable text box. */}
      <div
        aria-label="Diff output"
        aria-live="polite"
        aria-multiline="true"
        aria-readonly="true"
        className={diffOutputClass}
        onKeyDown={selectDiffOutput}
        role="textbox"
        tabIndex={0}
      >
        {diff
          ? diff.split("\n").map((line, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Repeated, stateless diff lines are identified by their position in the output.
              <span className={getDiffLineClass(line)} key={`${index}-${line}`}>
                {line || " "}
              </span>
            ))
          : "No changes"}
      </div>
    </section>
  );
};

export { DiffOutput };
