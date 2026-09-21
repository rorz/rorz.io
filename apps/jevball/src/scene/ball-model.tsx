// biome-ignore-all lint/style/noMagicNumbers: Geometry, canvas coordinates and lighting coefficients are visual design values.
// biome-ignore-all lint/suspicious/noUnknownAttribute: React Three Fiber elements use Three.js properties rather than DOM attributes.
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { BackSide } from "three";
import { type Atmosphere, reflectAtmosphere } from "./atmosphere.ts";
import { type BallModelProps, fullTurn, useBallMotion } from "./ball-motion.ts";
import { createDie } from "./die.ts";
import { submergedDepth } from "./die-motion.ts";
import { ballRadius, createEight } from "./eight.ts";
import { createLens, liquidMaterial } from "./liquid.ts";
import { usePointerParallax } from "./pointer-parallax.ts";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Keep the declarative shell, window and die geometry together.
const BallModel = (
  props: BallModelProps & {
    readonly atmosphere: Atmosphere;
  },
) => {
  const { palette } = props;
  const lens = useMemo(createLens, []);
  const reflect = useMemo(
    () => reflectAtmosphere(props.atmosphere),
    [
      props.atmosphere,
    ],
  );
  const presentation = usePointerParallax(props.phase !== "turning", props.reducedMotion);
  const die = useMemo(
    () => createDie(palette),
    [
      palette,
    ],
  );
  const eight = useMemo(
    () => createEight(palette),
    [
      palette,
    ],
  );
  const { floatingDie, liquidTime, shell, worldToBall } = useBallMotion(props, die.orientations);
  const absorbLight = useMemo(
    () => liquidMaterial(worldToBall.current, liquidTime.current),
    [
      worldToBall,
      liquidTime,
    ],
  );
  const viewport = useThree((state) => state.viewport);
  const scale = Math.min(1, viewport.width / 4.1, viewport.height / 6.5);
  useEffect(
    () => () => {
      die.geometry.dispose();
      for (const texture of die.textures) {
        texture.dispose();
      }
      eight.geometry.dispose();
      eight.texture.dispose();
      lens.dispose();
    },
    [
      die,
      eight,
      lens,
    ],
  );
  return (
    <group
      position={[
        0,
        -0.25,
        0,
      ]}
      ref={presentation.group}
      scale={scale}
    >
      <group
        ref={shell}
        rotation={[
          Math.PI,
          0,
          0,
        ]}
      >
        <mesh
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
        >
          <sphereGeometry
            args={[
              ballRadius,
              96,
              64,
              0,
              fullTurn,
              0.52,
              Math.PI - 0.52,
            ]}
          />
          <meshPhysicalMaterial
            clearcoat={1}
            clearcoatRoughness={0.1}
            color={palette.ink}
            envMapIntensity={1.5}
            metalness={0.3}
            onBeforeCompile={reflect}
            roughness={0.22}
          />
        </mesh>
        <mesh
          geometry={eight.geometry}
          rotation={[
            Math.PI,
            0,
            0,
          ]}
        >
          <meshStandardMaterial
            alphaTest={0.5}
            map={eight.texture}
            metalness={0.05}
            onBeforeCompile={reflect}
            roughness={0.35}
          />
        </mesh>
        <mesh
          position={[
            0,
            0,
            1.344,
          ]}
        >
          <torusGeometry
            args={[
              0.767,
              0.026,
              16,
              96,
            ]}
          />
          <meshStandardMaterial
            color={palette.metal}
            metalness={0.85}
            onBeforeCompile={reflect}
            roughness={0.23}
          />
        </mesh>
        <mesh
          position={[
            0,
            0,
            1.325,
          ]}
        >
          <torusGeometry
            args={[
              0.733,
              0.047,
              16,
              96,
            ]}
          />
          <meshPhysicalMaterial
            clearcoat={1}
            color={palette.ink}
            metalness={0.3}
            onBeforeCompile={reflect}
            roughness={0.17}
          />
        </mesh>
        <mesh>
          <sphereGeometry
            args={[
              1.5,
              64,
              48,
            ]}
          />
          <meshBasicMaterial color={palette.ink} side={BackSide} />
        </mesh>
        <group ref={presentation.inverse}>
          <mesh
            geometry={die.geometry}
            position={[
              0,
              0,
              submergedDepth,
            ]}
            ref={floatingDie}
          >
            {die.textures.map((texture, index) => (
              <meshStandardMaterial
                attach={`material-${index}`}
                color={palette.paper}
                emissive={palette.light}
                emissiveIntensity={0.35}
                emissiveMap={texture}
                key={texture.uuid}
                map={texture}
                metalness={0.1}
                onBeforeCompile={absorbLight}
                roughness={0.45}
              />
            ))}
          </mesh>
        </group>
        <mesh geometry={lens}>
          <meshPhysicalMaterial
            attenuationColor={palette.blue}
            attenuationDistance={0.5}
            clearcoat={0.1}
            clearcoatRoughness={0.06}
            color={palette.paper}
            depthWrite={false}
            dispersion={0.15}
            envMapIntensity={0.05}
            ior={1.33}
            onBeforeCompile={reflect}
            roughness={0.04}
            specularIntensity={0.05}
            thickness={0.06}
            transmission={1}
          />
        </mesh>
      </group>
    </group>
  );
};

export { BallModel };
