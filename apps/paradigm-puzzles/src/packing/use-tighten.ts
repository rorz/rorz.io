import { useEffect, useRef, useState } from "react";
import type { Scene } from "./model.ts";
import type { TightenOptions } from "./search-space.ts";
import { evaluateScene, type SearchUpdate } from "./tighten.ts";

const useTighten = () => {
  const worker = useRef<Worker | null>(null);
  const [result, setResult] = useState<SearchUpdate | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const stop = () => {
    worker.current?.terminate();
    worker.current = null;
    setRunning(false);
  };
  useEffect(() => () => worker.current?.terminate(), []);
  const start = (scene: Scene, options: TightenOptions) => {
    stop();
    setError("");
    const initial = evaluateScene(scene);
    setResult({
      best: initial,
      elapsed: 0,
      evaluations: 1,
      finished: false,
      initial: {
        overlaps: initial.overlaps,
        radius: initial.radius,
      },
      reason: initial.overlaps > 0 ? "Repairing overlaps…" : "Searching…",
      restarts: 0,
      scale: 1,
      seed: options.seed ?? 42,
    });
    try {
      const active = new Worker(new URL("./tighten.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.current = active;
      active.onmessage = (event: MessageEvent<SearchUpdate>) => {
        if (worker.current !== active) {
          return;
        }
        setResult(event.data);
        if (event.data.finished) {
          stop();
        }
      };
      active.onerror = (event) => {
        if (worker.current !== active) {
          return;
        }
        setError(event.message || "The search worker stopped unexpectedly.");
        stop();
      };
      setRunning(true);
      active.postMessage({
        options,
        scene,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      stop();
    }
  };
  const discard = () => {
    stop();
    setResult(null);
    setError("");
  };
  return {
    discard,
    error,
    result,
    running,
    start,
    stop,
  };
};

export { useTighten };
