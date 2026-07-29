import { expect, test } from "bun:test";
import { sortBy } from "./sort.ts";

interface RatedNote {
  readonly name: string;
  readonly properties: {
    readonly rating?: number;
    readonly title: string;
  };
}

test("sortBy orders numeric properties without mutating notes and places missing values last", () => {
  const notes: readonly RatedNote[] = [
    {
      name: "Unrated",
      properties: {
        title: "Unrated",
      },
    },
    {
      name: "Highest",
      properties: {
        rating: 5,
        title: "Highest",
      },
    },
    {
      name: "Lowest",
      properties: {
        rating: 1,
        title: "Lowest",
      },
    },
  ];

  expect(sortBy(notes, "rating").map((note) => note.name)).toEqual([
    "Lowest",
    "Highest",
    "Unrated",
  ]);
  expect(notes.map((note) => note.name)).toEqual([
    "Unrated",
    "Highest",
    "Lowest",
  ]);
});

test("sortBy rejects non-sortable properties in its types and at runtime", () => {
  const notes: readonly RatedNote[] = [
    {
      name: "First page",
      properties: {
        title: "First page",
      },
    },
    {
      name: "Second page",
      properties: {
        title: "Second page",
      },
    },
  ];

  expect(() => {
    // @ts-expect-error Text comparison needs an explicit ordering policy.
    sortBy(notes, "title");
  }).toThrow('Property "title" must be a number or date to sort it');
});
