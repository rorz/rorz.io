// biome-ignore-all lint/style/noMagicNumbers: Geometry, canvas coordinates and lighting coefficients are visual design values.
// biome-ignore-all lint/suspicious/noUnknownAttribute: React Three Fiber elements use Three.js properties rather than DOM attributes.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, type ShaderMaterial, Vector2 } from "three";
import type { Atmosphere } from "./atmosphere.ts";
import type { Palette } from "./palette.ts";

// Adapted from React Bits' Balatro shader by David Haz (MIT + Commons Clause).
// https://reactbits.dev/backgrounds/balatro — license in ../../REACT-BITS-LICENSE.md.
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.999, 1.0);
}`;

const fragmentShader = `
uniform float uTime;
uniform float uActivity;
uniform float uNudge;
uniform float uHue;
uniform vec2 uResolution;
uniform vec3 uInk;
uniform vec3 uBlue;
uniform vec3 uPurple;
uniform vec3 uLight;
varying vec2 vUv;

vec3 shiftHue(vec3 color) {
  vec3 axis = normalize(vec3(1.0));
  float cosine = cos(uHue);
  return max(vec3(0.0), color * cosine + cross(axis, color) * sin(uHue) +
    axis * dot(axis, color) * (1.0 - cosine));
}

vec3 paint(vec2 screen, vec2 coords) {
  float pixel = length(screen) / 900.0;
  vec2 uv = (floor(coords / pixel) * pixel - 0.5 * screen) / length(screen);
  float radius = length(uv);
  float angle = atan(uv.y, uv.x) - 0.07 * uTime + 302.2 + uNudge - 20.0 * (0.25 * radius + 0.75);
  uv = vec2(radius * cos(angle), radius * sin(angle)) * 30.0;
  float speed = uTime * 2.4;
  vec2 uv2 = vec2(uv.x + uv.y);
  for (int i = 0; i < 5; i++) {
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121), sin(uv2.x - 0.113 * speed));
    uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
  }
  float contrast = 2.2;
  float amount = clamp(length(uv) * 0.035 * contrast, 0.0, 2.0);
  float a = max(0.0, 1.0 - contrast * abs(1.0 - amount));
  float b = max(0.0, 1.0 - contrast * abs(amount));
  float c = 1.0 - min(1.0, a + b);
  return shiftHue(uPurple * a * 0.42 + uBlue * b * 0.55) + uInk * c;
}

void main() {
  vec2 offset = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  vec2 spotlight = offset - vec2(0.0, 0.15);
  float halo = exp(-dot(spotlight, spotlight) * 7.0);
  vec3 quiet = uInk * 0.12 + uLight * halo * 0.0015;
  vec3 color = quiet;
  if (uActivity > 0.001) {
    color = mix(quiet, paint(uResolution, vUv * uResolution), uActivity);
  }
  float vignette = 1.0 - smoothstep(0.2, 1.05, length(offset));
  color *= 0.45 + 0.55 * vignette;
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`;

const createUniforms = (palette: Palette) => ({
  uActivity: {
    value: 1,
  },
  uBlue: {
    value: palette.blue,
  },
  uHue: {
    value: 0,
  },
  uInk: {
    value: palette.ink,
  },
  uLight: {
    value: palette.light,
  },
  uNudge: {
    value: 0,
  },
  uPurple: {
    value: palette.purple,
  },
  uResolution: {
    value: new Vector2(1, 1),
  },
  uTime: {
    value: 0,
  },
});

const createNudge = (previousHue: number) => ({
  hue: MathUtils.clamp(previousHue + MathUtils.randFloatSpread(0.8), -0.9, 0.9),
  nudge: MathUtils.randFloat(-0.006, 0.006),
});

const advanceShader = (
  uniforms: ReturnType<typeof createUniforms>,
  target: ReturnType<typeof createNudge>,
  delta: number,
  {
    active,
    reducedMotion,
  }: {
    active: boolean;
    reducedMotion: boolean;
  },
) => {
  uniforms.uActivity.value = reducedMotion
    ? Number(active)
    : MathUtils.damp(uniforms.uActivity.value, active ? 1 : 0, active ? 6 : 2.4, delta);
  if (reducedMotion) {
    return false;
  }
  uniforms.uNudge.value = MathUtils.damp(uniforms.uNudge.value, target.nudge, 0.7, delta);
  uniforms.uHue.value = MathUtils.damp(uniforms.uHue.value, target.hue, 0.7, delta);
  uniforms.uTime.value += Math.min(delta, 0.05) * (0.15 + uniforms.uActivity.value);
  return active || uniforms.uActivity.value > 0.001;
};

const Balatro = ({
  active,
  atmosphere,
  palette,
  question,
  reducedMotion,
}: {
  readonly active: boolean;
  readonly atmosphere: Atmosphere;
  readonly palette: Palette;
  readonly question: string;
  readonly reducedMotion: boolean;
}) => {
  const uniforms = useMemo(
    () => createUniforms(palette),
    [
      palette,
    ],
  );
  const material = useRef<
    ShaderMaterial & {
      uniforms: typeof uniforms;
    }
  >(null);
  const targets = useRef({
    hue: 0,
    nudge: 0,
  });
  useEffect(() => {
    if (question.length > 0) {
      targets.current = createNudge(targets.current.hue);
    }
  }, [
    question,
  ]);
  useFrame(({ size, invalidate }, delta) => {
    const animated = material.current?.uniforms;
    if (!animated) {
      return;
    }
    animated.uResolution.value.set(size.width, size.height);
    if (
      advanceShader(animated, targets.current, delta, {
        active,
        reducedMotion,
      })
    ) {
      invalidate();
    }
    atmosphere.hue.value = animated.uHue.value;
    atmosphere.activity.value = animated.uActivity.value;
  });
  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry
        args={[
          2,
          2,
        ]}
      />
      <shaderMaterial
        depthTest={false}
        depthWrite={false}
        fragmentShader={fragmentShader}
        ref={material}
        toneMapped={false}
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </mesh>
  );
};

export { Balatro };
