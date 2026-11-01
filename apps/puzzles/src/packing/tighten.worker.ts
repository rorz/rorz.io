import { runRelax, runSearch } from "./search-runner.ts";
import type { SearchRequest, SearchUpdate } from "./tighten.ts";

// This entry runs only in a dedicated worker; avoid mixing DOM and worker global libraries.
const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<SearchRequest>) => void) | null;
  postMessage: (update: SearchUpdate) => void;
};
workerScope.onmessage = (event) =>
  (event.data.mode === "relax" ? runRelax : runSearch)(event.data, (update) =>
    workerScope.postMessage(update),
  );
