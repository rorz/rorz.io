import { type ChangeEvent, type SyntheticEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "./controls.tsx";

const SaveDialog = ({
  defaultName,
  error,
  onClose,
  onSave,
}: {
  defaultName: string;
  error: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const inputId = useId();
  const [name, setName] = useState(defaultName);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    input.current?.select();
    return () => element?.close();
  }, []);
  const edit = (event: ChangeEvent<HTMLInputElement>) => setName(event.currentTarget.value);
  const cancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };
  return (
    <dialog
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto w-96 max-w-full border-2 border-black bg-white p-0 text-black backdrop:bg-black/30"
      onCancel={cancel}
      ref={dialog}
    >
      <h2 className="bg-black px-3 py-2 font-mono text-sm text-white" id={titleId}>
        Save arrangement
      </h2>
      <form className="space-y-4 p-4" onSubmit={submit}>
        <label className="block space-y-2 text-xs" htmlFor={inputId}>
          <span>Snapshot name</span>
          <input
            className="w-full border border-black bg-white px-2 py-1.5 text-sm outline-offset-2"
            id={inputId}
            maxLength={80}
            onChange={edit}
            ref={input}
            required={true}
            type="text"
            value={name}
          />
        </label>
        <p className="text-xs opacity-60">
          Includes all fan, display, camera, and search settings. Saved in this browser.
        </p>
        {error ? (
          <p className="text-xs" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <button
            className="border border-black bg-black px-3 py-1 text-xs text-white disabled:opacity-30"
            disabled={!name.trim()}
            type="submit"
          >
            Save snapshot
          </button>
        </div>
      </form>
    </dialog>
  );
};

export { SaveDialog };
