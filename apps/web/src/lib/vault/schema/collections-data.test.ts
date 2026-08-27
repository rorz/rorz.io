import { expect, mock, test } from "bun:test";
import { findCollectionEntries, sortCollectionPreviewEntries } from "./collections-data.ts";

const entriesByKind = {
  image: [
    {
      kind: "image",
      name: "Older image",
      properties: {
        date: new Date("2026-01-01"),
        previewRank: 1,
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
        previewRank: 2,
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

test("orders ranked previews first and keeps the remainder reverse chronological", () => {
  const entries = [
    {
      kind: "image",
      name: "Newest unranked",
      properties: {
        date: new Date("2026-04-01"),
      },
      webPath: "/images/newest-unranked",
    },
    {
      kind: "image",
      name: "Second preview",
      properties: {
        date: new Date("2026-03-01"),
        previewRank: 2,
      },
      webPath: "/images/second-preview",
    },
    {
      kind: "image",
      name: "First preview",
      properties: {
        date: new Date("2026-01-01"),
        previewRank: 1,
      },
      webPath: "/images/first-preview",
    },
    {
      kind: "image",
      name: "Older unranked",
      properties: {
        date: new Date("2026-02-01"),
      },
      webPath: "/images/older-unranked",
    },
  ] as never;

  expect(sortCollectionPreviewEntries(entries).map(({ webPath }) => webPath)).toEqual([
    "/images/first-preview",
    "/images/second-preview",
    "/images/newest-unranked",
    "/images/older-unranked",
  ]);
});
