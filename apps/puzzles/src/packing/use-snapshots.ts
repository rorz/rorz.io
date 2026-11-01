import { useEffect, useState } from "react";
import type { Snapshot } from "./editor-settings.ts";
import { readSnapshots, SNAPSHOTS_KEY, updateSnapshots } from "./snapshots.ts";

const describeError = (error: unknown) => (error instanceof Error ? error.message : String(error));
const load = () => {
  try {
    return {
      error: "",
      items: readSnapshots(globalThis.localStorage),
    };
  } catch (error) {
    return {
      error: describeError(error),
      items: [],
    };
  }
};
const useSnapshots = () => {
  const [library, setLibrary] = useState(load);
  const [removed, setRemoved] = useState<Snapshot | null>(null);
  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (event.key === SNAPSHOTS_KEY || event.key === null) {
        setLibrary(load());
      }
    };
    globalThis.addEventListener("storage", refresh);
    return () => globalThis.removeEventListener("storage", refresh);
  }, []);
  const mutate = (transform: (items: Snapshot[]) => Snapshot[]) => {
    try {
      const items = updateSnapshots(globalThis.localStorage, transform);
      setLibrary({
        error: "",
        items,
      });
      return true;
    } catch (error) {
      setLibrary((current) => ({
        ...current,
        error: describeError(error),
      }));
      return false;
    }
  };
  const add = (snapshot: Snapshot) =>
    mutate((items) => [
      snapshot,
      ...items,
    ]);
  const remove = (id: string) => {
    const found = library.items.find((item) => item.id === id);
    if (found && mutate((items) => items.filter((item) => item.id !== id))) {
      setRemoved(found);
    }
  };
  const undoRemove = () => {
    if (
      removed &&
      mutate((items) =>
        items.some((item) => item.id === removed.id)
          ? items
          : [
              removed,
              ...items,
            ],
      )
    ) {
      setRemoved(null);
    }
  };
  return {
    ...library,
    add,
    remove,
    removed,
    undoRemove,
  };
};

export { useSnapshots };
