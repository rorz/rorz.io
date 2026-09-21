// biome-ignore-all lint/style/noMagicNumbers: These values define the die's buoyancy, drift and angular drag.
import { Euler, MathUtils, type Mesh, Quaternion } from "three";

const submergedDepth = -0.45;
const surfaceDepth = 0.67;

const createDrift = () => ({
  angle: MathUtils.randFloat(0, Math.PI * 2),
  direction: Math.random() < 0.5 ? -1 : 1,
  duration: MathUtils.randFloat(0.95, 1.15),
  elapsed: 0,
  frequency: MathUtils.randFloat(0.7, 1.1),
  offset: new Quaternion(),
  target: new Quaternion(),
  tilt: new Euler(),
});

type Drift = ReturnType<typeof createDrift>;

const rise = (mesh: Mesh, orientation: Quaternion, drift: Drift, delta: number) => {
  drift.elapsed += delta;
  const progress = Math.min(drift.elapsed / drift.duration, 1);
  const remaining = 1 - progress;
  const angle = drift.angle + drift.direction * progress * 4.5;
  const time = drift.elapsed * drift.frequency;
  const orbit = 0.2 * remaining ** 1.4;
  mesh.position.set(
    Math.cos(angle) * orbit + Math.sin(time * 0.8) * 0.003 * progress,
    Math.sin(angle) * orbit + Math.sin(time * 1.1) * 0.003 * progress,
    MathUtils.lerp(submergedDepth, surfaceDepth, 1 - remaining ** 4) -
      (1 + Math.sin(time)) * 0.0015 * progress,
  );
  drift.tilt.set(
    Math.sin(angle) * 0.4 * remaining ** 2 + Math.sin(time * 0.8 + drift.angle) * 0.012 * progress,
    Math.cos(angle) * 0.3 * remaining ** 2 + Math.cos(time * 0.7 + drift.angle) * 0.01 * progress,
    drift.direction * 1.6 * remaining ** 1.3 + Math.sin(time) * 0.006 * progress,
  );
  drift.target.copy(orientation).premultiply(drift.offset.setFromEuler(drift.tilt));
  mesh.quaternion.slerp(drift.target, 1 - Math.exp(-(9 + progress * 4) * delta));
  return progress > 0.9;
};

const floatDie = (
  mesh: Mesh,
  drift: Drift,
  delta: number,
  {
    emerging,
    orientation,
    reducedMotion,
  }: {
    emerging: boolean;
    orientation: Quaternion;
    reducedMotion: boolean;
  },
) => {
  if (reducedMotion) {
    mesh.position.set(0, 0, emerging ? surfaceDepth : submergedDepth);
    mesh.quaternion.copy(orientation);
    return emerging;
  }
  if (emerging) {
    return rise(mesh, orientation, drift, delta);
  }
  drift.elapsed = 0;
  mesh.position.x = MathUtils.damp(mesh.position.x, 0, 4, delta);
  mesh.position.y = MathUtils.damp(mesh.position.y, -0.12, 4, delta);
  mesh.position.z = MathUtils.damp(mesh.position.z, submergedDepth, 4, delta);
  mesh.rotation.x += delta * 1.2;
  mesh.rotation.y += delta * 0.8 * drift.direction;
  return false;
};

export { createDrift, floatDie, submergedDepth };
