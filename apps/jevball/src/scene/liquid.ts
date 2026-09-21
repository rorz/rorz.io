// biome-ignore-all lint/style/noMagicNumbers: These dimensions describe the shallow convex window.
import { type Matrix4, type MeshStandardMaterial, SphereGeometry } from "three";

const createLens = () => {
  const radius = 10;
  const aperture = 0.725;
  return new SphereGeometry(radius, 64, 12, 0, Math.PI * 2, 0, Math.asin(aperture / radius))
    .rotateX(Math.PI / 2)
    .translate(0, 0, 1.365 - Math.sqrt(radius ** 2 - aperture ** 2));
};

// Absorption is measured in the ball's coordinates, so it follows the upward turn.
// Faces deeper in the ink disappear; the face at the window becomes legible.
const liquidMaterial =
  (
    worldToBall: Matrix4,
    time: {
      value: number;
    },
  ): MeshStandardMaterial["onBeforeCompile"] =>
  (shader) => {
    shader.uniforms.uWorldToBall = {
      value: worldToBall,
    };
    shader.uniforms.uLiquidTime = time;
    shader.vertexShader = `uniform mat4 uWorldToBall;\nvarying float vLiquidDepth;\nvarying float vLiquidFacing;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
    #include <begin_vertex>
    vLiquidDepth = 1.37 - (uWorldToBall * modelMatrix * vec4(transformed, 1.0)).z;
    vLiquidFacing = normalize(mat3(uWorldToBall * modelMatrix) * normal).z;
  `,
    );
    shader.fragmentShader = `uniform float uLiquidTime;\nvarying float vLiquidDepth;\nvarying float vLiquidFacing;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `
    vec2 ripple = vec2(
      sin(vMapUv.y * 24.0 + uLiquidTime * 1.1),
      cos(vMapUv.x * 19.0 - uLiquidTime * 0.8)
    );
    vec2 bend = ripple * (0.002 + max(0.0, vLiquidDepth) * 0.014);
    vec4 sampledDiffuseColor = texture2D(map, vMapUv + bend);
    sampledDiffuseColor.r = texture2D(map, vMapUv + bend * 1.65).r;
    sampledDiffuseColor.b = texture2D(map, vMapUv + bend * 0.45).b;
    diffuseColor *= sampledDiffuseColor;
  `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "totalEmissiveRadiance *= sampledDiffuseColor.rgb;",
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `
    float edge = min(1.0 - vMapUv.y, min(
      vMapUv.x - 0.5 * (1.0 - vMapUv.y),
      1.0 - vMapUv.x - 0.5 * (1.0 - vMapUv.y)
    ));
    vec3 feather = smoothstep(vec3(0.0), vec3(0.016, 0.012, 0.022), vec3(edge));
    float facing = mix(0.12, 1.0, smoothstep(0.75, 0.96, vLiquidFacing));
    outgoingLight *= feather * facing * exp(-max(0.0, vLiquidDepth - 0.005) * 28.0);
    #include <opaque_fragment>
  `,
    );
  };

export { createLens, liquidMaterial };
