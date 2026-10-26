import type { MouseEvent } from "react";
import type { Contact } from "./clearance.ts";
import { farthestPoint } from "./enclosure.ts";
import type { Circle, Shape } from "./model.ts";

const ContactDiagnostics = ({
  contacts,
  circle,
  shapes,
  select,
}: {
  contacts: Contact[];
  circle: Circle;
  shapes: Shape[];
  select: (id: string) => void;
}) => {
  const pick = (event: MouseEvent<HTMLButtonElement>) => select(event.currentTarget.value);
  return (
    <div className="mt-3 space-y-2 border-t border-black pt-3">
      <p>
        Signed clearance in unit radii. Positive = gap; negative = penetration, including overlaps
        below the area tolerance. Pairs within 0.02 are listed.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Clearance</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={`${contact.a}/${contact.b}`}>
                <td>
                  <button
                    className="underline"
                    onClick={pick}
                    type="button"
                    value={contact.a.split(".")[0] ?? "1"}
                  >
                    {contact.a} ↔ {contact.b}
                  </button>
                </td>
                <td>{contact.gap.toExponential(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Shape</th>
              <th>Circle clearance</th>
            </tr>
          </thead>
          <tbody>
            {shapes.map((shape) => {
              const point = farthestPoint(shape, circle);
              const gap = circle.radius - Math.hypot(point.x - circle.x, point.y - circle.y);
              return (
                <tr key={shape.id}>
                  <td>{shape.id}</td>
                  <td>{gap.toExponential(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { ContactDiagnostics };
