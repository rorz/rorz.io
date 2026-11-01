// biome-ignore-all lint/style/noMagicNumbers: canvas strokes, labels, and unit geometry.

import type { Contact } from "./clearance.ts";
import { drawContacts } from "./draw-contacts.ts";
import { type Circle, type Collision, type Fan, type Point, type Shape, TAU } from "./model.ts";

type Viewport = Point & {
  scale: number;
};
type Size = {
  width: number;
  height: number;
};
type Display = {
  circle: boolean;
  grid: boolean;
  guides: boolean;
  labels: boolean;
  contacts?: boolean;
  fullPrecision?: boolean;
};
type Drawing = {
  circle: Circle;
  collisions: Collision[];
  contacts: Contact[];
  display: Display;
  fans: Fan[];
  selected: string;
  shapes: Shape[];
  size: Size;
  viewport: Viewport;
};
const shapePath = (shape: Shape) => {
  const path = new Path2D();
  path.arc(shape.x, shape.y, 1, shape.theta - Math.PI / 2, shape.theta + Math.PI / 2);
  path.closePath();
  return path;
};
const label = (ctx: CanvasRenderingContext2D, point: Point, text: string, scale: number) => {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.scale(1 / scale, -1 / scale);
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = ctx.measureText(text).width + 6;
  ctx.fillStyle = "white";
  ctx.fillRect(-width / 2, -7, width, 14);
  ctx.fillStyle = "black";
  ctx.fillText(text, 0, 0);
  ctx.restore();
};
const grid = (ctx: CanvasRenderingContext2D, { size, viewport }: Drawing) => {
  const { scale, x, y } = viewport;
  const left = Math.floor(x - size.width / (2 * scale));
  const right = Math.ceil(x + size.width / (2 * scale));
  const bottom = Math.floor(y - size.height / (2 * scale));
  const top = Math.ceil(y + size.height / (2 * scale));
  ctx.globalAlpha = 0.25;
  for (let gx = left; gx <= right; gx++) {
    for (let gy = bottom; gy <= top; gy++) {
      ctx.fillRect(gx - 0.5 / scale, gy - 0.5 / scale, 1 / scale, 1 / scale);
    }
  }
  ctx.beginPath();
  ctx.moveTo(left, 0);
  ctx.lineTo(right, 0);
  ctx.moveTo(0, bottom);
  ctx.lineTo(0, top);
  ctx.lineWidth = 1 / scale;
  ctx.setLineDash([
    3 / scale,
    5 / scale,
  ]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
};
const hatch = (ctx: CanvasRenderingContext2D, drawing: Drawing, ratio: number) => {
  const { collisions, shapes, size } = drawing;
  const tile = document.createElement("canvas");
  tile.width = 7;
  tile.height = 7;
  const ink = tile.getContext("2d");
  if (!ink) {
    return;
  }
  ink.beginPath();
  ink.moveTo(0, 0);
  ink.lineTo(7, 7);
  ink.stroke();
  const pattern = ctx.createPattern(tile, "repeat");
  if (!pattern) {
    return;
  }
  const shapeById = new Map(
    shapes.map((shape) => [
      shape.id,
      shape,
    ]),
  );
  const regions = new Map<string, Path2D>();
  // Union the other shapes for each first shape; dense scenes need at most N clips.
  for (const collision of collisions) {
    const b = shapeById.get(collision.b);
    if (b) {
      const region = regions.get(collision.a) ?? new Path2D();
      region.addPath(shapePath(b));
      regions.set(collision.a, region);
    }
  }
  for (const [id, region] of regions) {
    const a = shapeById.get(id);
    if (!a) {
      continue;
    }
    ctx.save();
    ctx.clip(shapePath(a));
    ctx.clip(region);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.restore();
  }
};
const guides = (ctx: CanvasRenderingContext2D, drawing: Drawing) => {
  const { fans, selected, shapes, viewport } = drawing;
  const fan = fans.find((item) => item.id === selected);
  if (!fan) {
    return;
  }
  ctx.lineWidth = 1 / viewport.scale;
  ctx.setLineDash([
    2 / viewport.scale,
    4 / viewport.scale,
  ]);
  for (const shape of shapes.filter((item) => item.fanId === selected)) {
    ctx.beginPath();
    ctx.moveTo(fan.x, fan.y);
    ctx.lineTo(shape.x, shape.y);
    ctx.lineTo(shape.x + Math.cos(shape.theta), shape.y + Math.sin(shape.theta));
    ctx.stroke();
  }
  ctx.setLineDash([]);
};
const enclosure = (ctx: CanvasRenderingContext2D, circle: Circle, scale: number) => {
  ctx.lineWidth = 1.5 / scale;
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, circle.radius, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(circle.x, circle.y);
  ctx.lineTo(circle.x + circle.radius, circle.y);
  ctx.setLineDash([
    4 / scale,
    4 / scale,
  ]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillRect(circle.x - 2 / scale, circle.y - 2 / scale, 4 / scale, 4 / scale);
  label(
    ctx,
    {
      x: circle.x + circle.radius / 2,
      y: circle.y + 12 / scale,
    },
    `R ${circle.radius.toFixed(9)}`,
    scale,
  );
};
const drawScene = (canvas: HTMLCanvasElement, drawing: Drawing) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const ratio = window.devicePixelRatio || 1;
  const { size, viewport, display, shapes, selected, fans, circle } = drawing;
  // A collapsed or hidden viewport has no world scale; never iterate an infinite grid.
  if (size.width <= 0 || size.height <= 0 || viewport.scale <= 0) {
    return;
  }
  canvas.width = Math.round(size.width * ratio);
  canvas.height = Math.round(size.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.translate(size.width / 2, size.height / 2);
  ctx.scale(viewport.scale, -viewport.scale);
  ctx.translate(-viewport.x, -viewport.y);
  ctx.strokeStyle = "black";
  ctx.fillStyle = "black";
  if (display.grid) {
    grid(ctx, drawing);
  }
  for (const shape of shapes) {
    const path = shapePath(shape);
    ctx.fillStyle = "white";
    ctx.fill(path);
  }
  hatch(ctx, drawing, ratio);
  for (const shape of shapes) {
    ctx.lineWidth = (shape.fanId === selected ? 1.75 : 0.75) / viewport.scale;
    ctx.stroke(shapePath(shape));
  }
  ctx.fillStyle = "black";
  if (display.guides) {
    guides(ctx, drawing);
  }
  if (display.labels) {
    for (const shape of shapes) {
      label(
        ctx,
        {
          x: shape.x + Math.cos(shape.theta) * 0.45,
          y: shape.y + Math.sin(shape.theta) * 0.45,
        },
        shape.id,
        viewport.scale,
      );
    }
  }
  if (display.circle) {
    enclosure(ctx, circle, viewport.scale);
  }
  if (display.contacts) {
    drawContacts(ctx, drawing, viewport.scale);
  }
  const fan = fans.find((item) => item.id === selected);
  if (fan) {
    ctx.lineWidth = 1 / viewport.scale;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(fan.x, fan.y, 5 / viewport.scale, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fan.x - 9 / viewport.scale, fan.y);
    ctx.lineTo(fan.x + 9 / viewport.scale, fan.y);
    ctx.moveTo(fan.x, fan.y - 9 / viewport.scale);
    ctx.lineTo(fan.x, fan.y + 9 / viewport.scale);
    ctx.stroke();
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = "black";
  ctx.fillRect(20, size.height - 25, viewport.scale, 1);
  ctx.fillRect(20, size.height - 28, 1, 7);
  ctx.fillRect(20 + viewport.scale, size.height - 28, 1, 7);
  ctx.font = "11px monospace";
  ctx.fillText("1 unit", 20, size.height - 34);
};

export type { Display, Drawing, Size, Viewport };
export { drawScene };
