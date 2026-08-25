import { expect, test } from "bun:test";
import { getEntryNavigation } from "./entry-navigation.ts";

const entries = [
  {
    name: "Newest",
    webPath: "/newest",
  },
  {
    name: "Middle",
    webPath: "/middle",
  },
  {
    name: "Oldest",
    webPath: "/oldest",
  },
] as const;

const getTitle = ({ name }: (typeof entries)[number]) => name;

test("returns only the neighbours of the current entry", () => {
  expect(getEntryNavigation(entries, "/middle", getTitle)).toEqual({
    next: {
      href: "/oldest",
      title: "Oldest",
    },
    previous: {
      href: "/newest",
      title: "Newest",
    },
  });
  expect(getEntryNavigation(entries, "/newest", getTitle)).toEqual({
    next: {
      href: "/middle",
      title: "Middle",
    },
  });
  expect(getEntryNavigation(entries, "/oldest", getTitle)).toEqual({
    previous: {
      href: "/middle",
      title: "Middle",
    },
  });
  expect(getEntryNavigation(entries, "/missing", getTitle)).toEqual({});
});
