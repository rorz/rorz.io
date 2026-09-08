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
  <label className="relative block min-h-0 min-w-0 border-b border-[#25282d] max-[720px]:border-r max-[720px]:border-b-0">
    <Tag>{label}</Tag>
    <textarea
      className="block h-full w-full resize-none border-0 bg-[#101113] px-3.5 pt-[38px] pb-3.5 font-mono text-[14px]/[1.5] text-[#eef1f4] outline-0 [tab-size:2] placeholder:text-[#6f7782] focus:bg-[#14161a]"
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
    <main className="grid h-screen w-screen grid-cols-[minmax(280px,38vw)_1px_minmax(0,1fr)] bg-[#101113] max-[720px]:grid-cols-1 max-[720px]:grid-rows-[minmax(0,1fr)_1px_minmax(0,1fr)]">
      <section
        aria-label="Diff inputs"
        className="grid min-h-0 grid-rows-2 max-[720px]:grid-cols-2 max-[720px]:grid-rows-1"
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
      <div aria-hidden="true" className="bg-[#30343a]" />
      <DiffOutput
        diff={diff}
        includeGitMetadata={includeGitMetadata}
        onMetadataChange={changeMetadata}
      />
      <a
        className="fixed right-3.5 bottom-3 z-40 text-xs/none text-[#aeb6c2] no-underline hover:text-[#f1f3f5] hover:underline focus-visible:text-[#f1f3f5] focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7d9f73]"
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
