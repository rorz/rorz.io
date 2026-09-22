// biome-ignore-all lint/style/noMagicNumbers: Geometry, canvas coordinates and lighting coefficients are visual design values.
import {
  CanvasTexture,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import { answerCatalog } from "../answers.ts";
import { faceLayout } from "../face-label.ts";
import type { Palette } from "./palette.ts";

const textureSize = 512;

const createFaceTexture = (text: string, palette: Palette) => {
  const canvas = document.createElement("canvas");
  canvas.width = textureSize;
  canvas.height = textureSize;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable.");
  }
  context.fillStyle = palette.die.getStyle();
  context.fillRect(0, 0, textureSize, textureSize);
  context.fillStyle = palette.paper.getStyle();
  context.textAlign = "center";
  context.textBaseline = "middle";
  const font = getComputedStyle(document.body).fontFamily;
  context.font = `600 100px ${font}`;
  const layout = faceLayout(text, (line) => context.measureText(line).width);
  context.font = `600 ${layout.fontSize}px ${font}`;
  for (const line of layout.lines) {
    context.fillText(line.text, 256, line.y);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

const createDie = (palette: Palette) => {
  const geometry = new IcosahedronGeometry(0.88, 0);
  const positions = geometry.getAttribute("position");
  const orientations: Quaternion[] = [];
  const uv: number[] = [];
  const forward = new Vector3(0, 0, 1);
  for (const answer of answerCatalog) {
    const offset = answer.faceIndex * 3;
    const a = new Vector3().fromBufferAttribute(positions, offset);
    const b = new Vector3().fromBufferAttribute(positions, offset + 1);
    const c = new Vector3().fromBufferAttribute(positions, offset + 2);
    const center = a.clone().add(b).add(c).divideScalar(3);
    const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    const orientation = new Quaternion().setFromUnitVectors(normal, forward);
    const top = a.clone().sub(center).applyQuaternion(orientation);
    orientation.premultiply(
      new Quaternion().setFromAxisAngle(forward, Math.atan2(top.x, top.y) + Math.PI),
    );
    orientations.push(orientation);
    // Point the triangle down while keeping its inscription upright.
    uv.push(0.5, 0, 1, 1, 0, 1);
    geometry.addGroup(offset, 3, answer.faceIndex);
  }
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  const textures = answerCatalog.map((answer) => createFaceTexture(answer.text, palette));
  return {
    geometry,
    orientations,
    textures,
  };
};

export { createDie };
