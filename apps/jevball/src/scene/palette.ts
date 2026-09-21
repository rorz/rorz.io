// biome-ignore-all lint/style/noMagicNumbers: Geometry, canvas coordinates and lighting coefficients are visual design values.
import { Color, SRGBColorSpace } from "three";

// Read the existing Tailwind palette so the scene and interface share their colours.
const createPalette = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!context) {
    throw new Error("Canvas is unavailable.");
  }
  const style = getComputedStyle(document.documentElement);
  const color = (token: string) => {
    context.fillStyle = style.getPropertyValue(`--color-${token}`).trim();
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return new Color().setRGB(red / 255, green / 255, blue / 255, SRGBColorSpace);
  };
  return {
    blue: color("indigo-500"),
    die: color("blue-600"),
    ink: color("zinc-950"),
    light: color("violet-200"),
    metal: color("zinc-700"),
    paper: color("zinc-100"),
    purple: color("violet-500"),
  };
};

type Palette = ReturnType<typeof createPalette>;

export type { Palette };
export { createPalette };
