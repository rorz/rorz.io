// biome-ignore-all lint/style/noMagicNumbers: These are the motion's angles, durations and damping coefficients.
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type Group, MathUtils, Matrix4, type Mesh, type Quaternion } from "three";
import type { AskResult } from "../protocol.ts";
import { createDrift, floatDie, submergedDepth } from "./die-motion.ts";
import type { Palette } from "./palette.ts";
import { useTypingWobble } from "./typing-wobble.ts";

interface BallModelProps {
  readonly onReveal: () => void;
  readonly palette: Palette;
  readonly phase: "idle" | "turning" | "revealed";
  readonly question: string;
  readonly reducedMotion: boolean;
  readonly result: AskResult | null;
}

const fullTurn = Math.PI * 2;
const turnSeconds = 1.55;
const createTurn = (from: number, to: number) => ({
  elapsed: 0,
  from,
  notified: false,
  to,
});

const needsFrames = (phase: BallModelProps["phase"], progress: number, depth: number) =>
  phase !== "idle" || progress < 1 || Math.abs(depth - submergedDepth) > 0.001;

const swingShell = (shell: Group, from: number, to: number, progress: number) => {
  shell.rotation.x = MathUtils.lerp(from, to, 1 - (1 - progress) ** 4);
  shell.rotation.z = Math.sin(progress * Math.PI * 3) * (1 - progress) ** 2 * 0.16;
};

const useBallMotion = (
  { phase, result, reducedMotion, onReveal, question }: BallModelProps,
  orientations: readonly Quaternion[],
) => {
  const orientation = orientations[result?.answer.faceIndex ?? 0];
  const wobble = useTypingWobble(question, reducedMotion);
  const shell = useRef<Group>(null);
  const floatingDie = useRef<Mesh>(null);
  const worldToBall = useRef(new Matrix4());
  const liquidTime = useRef({
    value: 0,
  });
  const drift = useRef<ReturnType<typeof createDrift> | null>(null);
  const motion = useRef(createTurn(Math.PI, Math.PI));
  useEffect(() => {
    if (phase === "revealed" || !shell.current) {
      return;
    }
    const from = shell.current.rotation.x;
    const next = Math.ceil(from / fullTurn) * fullTurn;
    drift.current = createDrift();
    motion.current = createTurn(from, next - (phase === "turning" ? fullTurn : Math.PI));
  }, [
    phase,
  ]);
  useFrame(({ invalidate }, frameDelta) => {
    if (!(shell.current && floatingDie.current && drift.current && orientation)) {
      return;
    }
    const delta = Math.min(frameDelta, 0.05);
    liquidTime.current.value += reducedMotion ? 0 : delta;
    const state = motion.current;
    state.elapsed += delta;
    const progress = reducedMotion ? 1 : Math.min(state.elapsed / turnSeconds, 1);
    swingShell(shell.current, state.from, state.to, progress);
    shell.current.rotation.x += wobble.current.x;
    shell.current.rotation.y = wobble.current.y;
    shell.current.rotation.z += wobble.current.z;
    const emerging = result !== null && progress > 0.18;
    const surfaced = floatDie(floatingDie.current, drift.current, delta, {
      emerging,
      orientation,
      reducedMotion,
    });
    shell.current.updateWorldMatrix(true, false);
    worldToBall.current.copy(shell.current.matrixWorld).invert();
    if (!reducedMotion && needsFrames(phase, progress, floatingDie.current.position.z)) {
      invalidate();
    }
    if (phase === "turning" && surfaced && progress === 1 && !state.notified) {
      state.notified = true;
      onReveal();
    }
  });
  return {
    floatingDie,
    liquidTime,
    shell,
    worldToBall,
  };
};

export type { BallModelProps };
export { fullTurn, useBallMotion };
