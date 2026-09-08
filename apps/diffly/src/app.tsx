import { type ChangeEventHandler, useMemo, useState } from "react";
import { createDiff } from "./diff.ts";
import { DiffOutput } from "./diff-output.tsx";
import { Tag } from "./tag.tsx";

interface InputPaneProps {
  readonly label: string;
  readonly onChange: ChangeEventHandler<HTMLTextAreaElement>;
  readonly placeholder: string;
  readonly value: string;
}

const InputPane = ({ label, onChange, placeholder, value }: InputPaneProps) => (
  <label className="relative block min-h-0 min-w-0">
    <Tag>{label}</Tag>
    <textarea
      className="block h-full w-full resize-none border-0 bg-zinc-950 px-3.5 pt-9.5 pb-3.5 font-mono text-sm leading-normal text-zinc-100 outline-0 tab-2 placeholder:text-zinc-500 focus:bg-zinc-900"
      onChange={onChange}
      placeholder={placeholder}
      spellCheck="false"
      value={value}
    />
  </label>
);

const App = () => {
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [includeGitMetadata, setIncludeGitMetadata] = useState(false);
  const diff = useMemo(
    () => createDiff(first, second, includeGitMetadata),
    [
      first,
      second,
      includeGitMetadata,
    ],
  );
  const changeFirst: ChangeEventHandler<HTMLTextAreaElement> = (event) =>
    setFirst(event.target.value);
  const changeSecond: ChangeEventHandler<HTMLTextAreaElement> = (event) =>
    setSecond(event.target.value);
  const changeMetadata: ChangeEventHandler<HTMLInputElement> = (event) =>
    setIncludeGitMetadata(event.target.checked);

  return (
    <main className="grid h-dvh w-full grid-cols-1 grid-rows-2 bg-zinc-950 md:grid-cols-8 md:grid-rows-1">
      <section
        aria-label="Diff inputs"
        className="grid min-h-0 grid-cols-2 divide-x divide-zinc-800 border-b border-zinc-700 md:col-span-3 md:grid-cols-1 md:grid-rows-2 md:divide-x-0 md:divide-y md:border-r md:border-b-0"
      >
        <InputPane
          label="Old text"
          onChange={changeFirst}
          placeholder="Insert the original text here..."
          value={first}
        />
        <InputPane
          label="New text"
          onChange={changeSecond}
          placeholder="Insert the updated text here..."
          value={second}
        />
      </section>
      <DiffOutput
        diff={diff}
        includeGitMetadata={includeGitMetadata}
        onMetadataChange={changeMetadata}
      />
      <a
        className="fixed right-3.5 bottom-3 z-40 text-xs/none text-zinc-400 no-underline hover:text-zinc-100 hover:underline focus-visible:text-zinc-100 focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-400"
        href="https://github.com/rorz/rorz.io/tree/main/apps/diffly"
        rel="noreferrer"
        target="_blank"
      >
        Open Source. Nothing is transmitted outside of this session.
      </a>
    </main>
  );
};

export { App };
