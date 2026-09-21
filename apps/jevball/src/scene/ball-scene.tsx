// biome-ignore-all lint/style/noMagicNumbers: Geometry, canvas coordinates and lighting coefficients are visual design values.
// biome-ignore-all lint/suspicious/noUnknownAttribute: React Three Fiber elements use Three.js properties rather than DOM attributes.
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, type ReactNode, useEffect, useMemo } from "react";
import { createAtmosphere } from "./atmosphere.ts";
import { Balatro } from "./balatro.tsx";
import { BallModel } from "./ball-model.tsx";
import type { BallModelProps } from "./ball-motion.ts";
import { createPalette } from "./palette.ts";

type BallSceneProps = Omit<BallModelProps, "palette">;

const SceneFallback = ({ result, onReveal }: BallSceneProps) => {
  useEffect(() => {
    if (result) {
      onReveal();
    }
  }, [
    result,
    onReveal,
  ]);
  return <div className="flex h-full items-center justify-center text-9xl text-violet-200">⑧</div>;
};

// biome-ignore lint/style/useReactFunctionComponents: React error boundaries require a class lifecycle.
class SceneBoundary extends Component<
  {
    readonly children: ReactNode;
    readonly fallback: ReactNode;
  },
  {
    failed: boolean;
  }
> {
  override state = {
    failed: false,
  };

  static getDerivedStateFromError() {
    return {
      failed: true,
    };
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: This is the declarative camera and studio lighting setup.
const BallScene = (props: BallSceneProps) => {
  const palette = useMemo(createPalette, []);
  const atmosphere = useMemo(createAtmosphere, []);
  return (
    <SceneBoundary fallback={<SceneFallback {...props} />}>
      <Canvas
        camera={{
          fov: 42,
          position: [
            0,
            0,
            7.8,
          ],
        }}
        dpr={[
          1,
          1.5,
        ]}
        fallback={<SceneFallback {...props} />}
        frameloop="demand"
        gl={{
          alpha: false,
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <Balatro
          active={props.phase !== "revealed"}
          atmosphere={atmosphere}
          palette={palette}
          question={props.question}
          reducedMotion={props.reducedMotion}
        />
        <ambientLight intensity={0.35} />
        <directionalLight
          color={palette.paper}
          intensity={3}
          position={[
            3,
            4,
            5,
          ]}
        />
        <pointLight
          color={palette.light}
          intensity={5}
          position={[
            -3,
            0,
            4,
          ]}
        />
        <Environment resolution={256}>
          <Lightformer
            color={palette.paper}
            intensity={4}
            position={[
              -3,
              3,
              4,
            ]}
            scale={[
              2,
              5,
            ]}
          />
          <Lightformer
            color={palette.paper}
            intensity={2}
            position={[
              3,
              1,
              2,
            ]}
            scale={[
              0.4,
              4,
            ]}
          />
          <Lightformer
            color={palette.blue}
            intensity={5}
            position={[
              0,
              -3,
              -2,
            ]}
            scale={[
              4,
              2,
            ]}
          />
          <Lightformer
            color={palette.light}
            form="ring"
            intensity={2}
            position={[
              0,
              4,
              -3,
            ]}
            scale={5}
          />
        </Environment>
        <BallModel {...props} atmosphere={atmosphere} palette={palette} />
      </Canvas>
    </SceneBoundary>
  );
};

export { BallScene };
