// biome-ignore-all lint/style/noMagicNumbers: These are the small angular impulses and spring damping values.
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, Vector3 } from "three";

const useTypingWobble = (question: string, reducedMotion: boolean) => {
  const angle = useRef(new Vector3());
  const velocity = useRef(new Vector3());
  useEffect(() => {
    if (question.length > 0 && !reducedMotion) {
      velocity.current.x += MathUtils.randFloat(-0.015, 0.015);
      velocity.current.y += MathUtils.randFloat(-0.02, 0.02);
      velocity.current.z += MathUtils.randFloat(-0.012, 0.012);
      velocity.current.clampLength(0, 0.04);
    }
  }, [
    question,
    reducedMotion,
  ]);
  useFrame((_, frameDelta) => {
    if (reducedMotion) {
      angle.current.set(0, 0, 0);
      velocity.current.set(0, 0, 0);
      return;
    }
    const delta = Math.min(frameDelta, 0.05);
    velocity.current
      .addScaledVector(angle.current, -9 * delta)
      .multiplyScalar(Math.exp(-6 * delta));
    angle.current.addScaledVector(velocity.current, delta);
  });
  return angle;
};

export { useTypingWobble };
