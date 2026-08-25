import { expect, mock, test } from "bun:test";
import { findCollectionEntries } from "./collections-data.ts";

const entriesByKind = {
  image: [
    {
      kind: "image",
      name: "Older image",
      properties: {
        date: new Date("2026-01-01"),
      },
      webPath: "/images/older-image",
    },
  ],
  video: [
    {
      kind: "video",
      name: "Newer video",
      properties: {
        date: new Date("2026-02-01"),
      },
      webPath: "/images/newer-video",
    },
  ],
} as const;

test("combines image and video collections in reverse chronological order", async () => {
  const findMany = mock(({ kind }: { readonly kind: keyof typeof entriesByKind }) =>
    Promise.resolve(entriesByKind[kind]),
  );

  const entries = await findCollectionEntries(
    {
      vaultPath: "Images/Photographs",
    } as never,
    {
      raw: "image",
      type: "string",
      value: "image",
    },
    {
      findMany,
    } as never,
  );

  expect(findMany.mock.calls.map(([{ kind }]) => kind)).toEqual([
    "image",
    "video",
  ]);
  expect(entries.map(({ webPath }) => webPath)).toEqual([
    "/images/newer-video",
    "/images/older-image",
  ]);
});
