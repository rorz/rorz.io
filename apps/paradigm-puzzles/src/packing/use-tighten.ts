import { useEffect, useRef, useState } from "react";
import type { Scene } from "./model.ts";
import { canResumeRelax } from "./relax-checkpoint.ts";
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
  const start = (scene: Scene, options: TightenOptions, mode: "tighten" | "relax" = "tighten") => {
    const checkpoint =
      mode === "relax" && canResumeRelax(result?.checkpoint, scene, options)
        ? result?.checkpoint
        : undefined;
    stop();
    setError("");
    const initial = evaluateScene(scene);
    setResult({
      best: initial,
      ...(checkpoint
        ? {
            checkpoint,
          }
        : {}),
      elapsed: 0,
      evaluations: checkpoint?.evaluations ?? 1,
      finished: false,
      initial: {
        overlaps: initial.overlaps,
        radius: initial.radius,
      },
      mode,
      reason: checkpoint
        ? "Continuing exploration…"
        : initial.overlaps > 0
          ? "Repairing overlaps…"
          : "Searching…",
      restarts: checkpoint?.restarts ?? 0,
      scale: checkpoint?.amplitude ?? 1,
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
        checkpoint,
        mode,
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
