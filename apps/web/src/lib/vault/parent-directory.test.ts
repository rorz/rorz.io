import { expect, mock, test } from "bun:test";
import { getParentDirectoryNavigation, getParentPagePaths } from "./parent-directory.ts";

test("derives parent directory-page candidates without special-casing a section", () => {
  expect(
    getParentPagePaths({
      kind: "folder",
      vaultPath: "Images/Photographs",
    }),
  ).toEqual([
    "Images/page",
    "Images/page--Images",
  ]);
  expect(
    getParentPagePaths({
      kind: "folder",
      vaultPath: "Lists/Reading",
    }),
  ).toEqual([
    "Lists/page",
    "Lists/page--Lists",
  ]);
  expect(
    getParentPagePaths({
      kind: "folder",
      vaultPath: "Images",
    }),
  ).toEqual([]);
});

test("builds back navigation from the resolved parent directory page", async () => {
  const resolve = mock((reference: { readonly path: string }) =>
    Promise.resolve(
      reference.path === "Images/page"
        ? {
            folder: {
              kind: "folder" as const,
              vaultPath: "Images",
            },
            name: "page",
            webPath: "/images",
          }
        : null,
    ),
  );
  const navigation = await getParentDirectoryNavigation(
    {
      folder: {
        kind: "folder",
        vaultPath: "Images/Photographs",
      },
      name: "page",
      webPath: "/images/photographs",
    },
    {
      resolve,
    } as never,
  );

  expect(navigation).toEqual({
    href: "/images",
    title: "Images",
  });
  expect(resolve).toHaveBeenCalledTimes(1);
});
