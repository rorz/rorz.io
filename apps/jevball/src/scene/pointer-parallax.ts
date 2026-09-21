// biome-ignore-all lint/style/noMagicNumbers: These are the parallax's maximum angles and easing rate.
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type Group, MathUtils, Vector2 } from "three";

const usePointerParallax = (enabled: boolean, reducedMotion: boolean) => {
  const group = useRef<Group>(null);
  const inverse = useRef<Group>(null);
  const pointer = useRef(new Vector2());
  useEffect(() => {
    const reset = () => pointer.current.set(0, 0);
    if (!enabled || reducedMotion) {
      reset();
      return;
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        pointer.current.set(event.clientX / innerWidth - 0.5, 0.5 - event.clientY / innerHeight);
      }
    };
    globalThis.addEventListener("pointermove", move);
    globalThis.addEventListener("blur", reset);
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      globalThis.removeEventListener("pointermove", move);
      globalThis.removeEventListener("blur", reset);
      document.documentElement.removeEventListener("pointerleave", reset);
    };
  }, [
    enabled,
    reducedMotion,
  ]);
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.x = reducedMotion
        ? 0
        : MathUtils.damp(group.current.rotation.x, -pointer.current.y * 0.1, 2.5, delta);
      group.current.rotation.y = reducedMotion
        ? 0
        : MathUtils.damp(group.current.rotation.y, pointer.current.x * 0.14, 2.5, delta);
      inverse.current?.position.set(
        -group.current.rotation.y * 0.25,
        group.current.rotation.x * 0.25,
        0,
      );
    }
  });
  return {
    group,
    inverse,
  };
};

export { usePointerParallax };
