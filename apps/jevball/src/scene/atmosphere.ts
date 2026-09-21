import type { MeshStandardMaterial } from "three";

const createAtmosphere = () => ({
  activity: {
    value: 1,
  },
  hue: {
    value: 0,
  },
});

type Atmosphere = ReturnType<typeof createAtmosphere>;

// Shift the coloured environment reflections with the background; preserve white highlights.
const reflectAtmosphere =
  (atmosphere: Atmosphere): MeshStandardMaterial["onBeforeCompile"] =>
  (shader) => {
    shader.uniforms.uAmbientHue = atmosphere.hue;
    shader.uniforms.uAmbientActivity = atmosphere.activity;
    shader.fragmentShader = `
      uniform float uAmbientHue;
      uniform float uAmbientActivity;
      vec3 ambientTint(vec3 light) {
        vec3 neutral = vec3(min(light.r, min(light.g, light.b)));
        vec3 color = light - neutral;
        vec3 axis = normalize(vec3(1.0));
        float cosine = cos(uAmbientHue);
        vec3 tinted = max(vec3(0.0), color * cosine + cross(axis, color) * sin(uAmbientHue) +
          axis * dot(axis, color) * (1.0 - cosine));
        return neutral + tinted * mix(0.18, 1.0, uAmbientActivity);
      }
    ${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_maps>",
      `
      #include <lights_fragment_maps>
      #if defined(USE_ENVMAP) && defined(RE_IndirectSpecular)
        radiance = ambientTint(radiance);
        #ifdef USE_CLEARCOAT
          clearcoatRadiance = ambientTint(clearcoatRadiance);
        #endif
      #endif
      `,
    );
  };

export type { Atmosphere };
export { createAtmosphere, reflectAtmosphere };
