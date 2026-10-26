// biome-ignore-all lint/style/noMagicNumbers: contact symbols in screen pixels and near-contact threshold.
import type { Contact } from "./clearance.ts";
import { farthestPoint } from "./enclosure.ts";
import type { Circle, Shape } from "./model.ts";

const drawContacts = (
  ctx: CanvasRenderingContext2D,
  {
    contacts,
    shapes,
    circle,
  }: {
    contacts: Contact[];
    shapes: Shape[];
    circle: Circle;
  },
  scale: number,
) => {
  ctx.save();
  ctx.lineWidth = 1.5 / scale;
  ctx.strokeStyle = "black";
  ctx.fillStyle = "white";
  for (const contact of contacts) {
    const x = (contact.first.x + contact.second.x) / 2;
    const y = (contact.first.y + contact.second.y) / 2;
    ctx.beginPath();
    ctx.moveTo(contact.first.x, contact.first.y);
    ctx.lineTo(contact.second.x, contact.second.y);
    ctx.stroke();
    ctx.beginPath();
    if (contact.gap < -1e-8) {
      ctx.moveTo(x - 3 / scale, y - 3 / scale);
      ctx.lineTo(x + 3 / scale, y + 3 / scale);
      ctx.moveTo(x - 3 / scale, y + 3 / scale);
      ctx.lineTo(x + 3 / scale, y - 3 / scale);
    } else {
      ctx.arc(x, y, 3 / scale, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.stroke();
  }
  for (const shape of shapes) {
    const point = farthestPoint(shape, circle);
    const gap = circle.radius - Math.hypot(point.x - circle.x, point.y - circle.y);
    if (gap < 0.02) {
      ctx.fillRect(point.x - 2 / scale, point.y - 2 / scale, 4 / scale, 4 / scale);
      ctx.strokeRect(point.x - 2 / scale, point.y - 2 / scale, 4 / scale, 4 / scale);
    }
  }
  ctx.restore();
};

export { drawContacts };
