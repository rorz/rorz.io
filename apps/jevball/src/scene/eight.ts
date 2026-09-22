// biome-ignore-all lint/style/noMagicNumbers: Geometry, canvas coordinates and lighting coefficients are visual design values.
import { CanvasTexture, PlaneGeometry, SRGBColorSpace } from "three";
import type { Palette } from "./palette.ts";

const ballRadius = 1.55;

const createEight = (palette: Palette) => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable.");
  }
  context.fillStyle = palette.paper.getStyle();
  context.beginPath();
  context.arc(256, 256, 245, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = palette.ink.getStyle();
  context.font = `500 360px ${getComputedStyle(document.body).fontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("8", 256, 278);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  const geometry = new PlaneGeometry(1.28, 1.28, 32, 32);
  const position = geometry.getAttribute("position");
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    position.setZ(index, Math.sqrt(ballRadius ** 2 - x ** 2 - y ** 2) + 0.004);
  }
  geometry.computeVertexNormals();
  return {
    geometry,
    texture,
  };
};

export { ballRadius, createEight };
