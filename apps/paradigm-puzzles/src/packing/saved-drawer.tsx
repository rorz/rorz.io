import { Button } from "./controls.tsx";
import { Drawer } from "./drawer.tsx";
import type { Snapshot } from "./editor-settings.ts";

const SnapshotCard = ({
  item,
  onLoad,
  onRemove,
}: {
  item: Snapshot;
  onLoad: (item: Snapshot) => void;
  onRemove: (id: string) => void;
}) => {
  const load = () => onLoad(item);
  const remove = () => onRemove(item.id);
  const count = item.settings.scene.fans.reduce((sum, fan) => sum + fan.count, 0);
  return (
    <li className="space-y-2 border-b border-black p-3">
      <h3 className="break-words text-sm font-bold">{item.name}</h3>
      <p className="font-mono text-xs">
        R {item.radius.toFixed(9)} · N {count} · {item.overlaps} overlaps
        {item.settings.display.fullPrecision ? " · unrounded" : ""}
      </p>
      <p className="text-xs opacity-60">
        <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
      </p>
      <div className="flex gap-2">
        <Button onClick={load}>Load</Button>
        <Button onClick={remove}>Remove</Button>
      </div>
    </li>
  );
};
const SavedDrawer = ({
  error,
  items,
  onClose,
  onLoad,
  onRemove,
  onSave,
  onUndoRemove,
  removedName,
  savingDisabled,
}: {
  error: string;
  items: Snapshot[];
  onClose: () => void;
  onLoad: (item: Snapshot) => void;
  onRemove: (id: string) => void;
  onSave: () => void;
  onUndoRemove: () => void;
  removedName: string | undefined;
  savingDisabled: boolean;
}) => (
  <Drawer onClose={onClose} title="Saved arrangements">
    <div className="space-y-3 border-b border-black p-3">
      <p className="text-xs opacity-60">Snapshots stay in this browser across reloads.</p>
      <Button disabled={savingDisabled} onClick={onSave}>
        Save current arrangement
      </Button>
      {error ? (
        <p className="text-xs" role="alert">
          {error}
        </p>
      ) : null}
      {removedName ? (
        <div className="space-y-2 text-xs">
          <p>Removed “{removedName}”.</p>
          <Button onClick={onUndoRemove}>Undo removal</Button>
        </div>
      ) : null}
    </div>
    {items.length === 0 ? (
      <p className="p-4 text-xs">No saved arrangements yet.</p>
    ) : (
      <ul>
        {items.map((item) => (
          <SnapshotCard item={item} key={item.id} onLoad={onLoad} onRemove={onRemove} />
        ))}
      </ul>
    )}
  </Drawer>
);

export { SavedDrawer };
