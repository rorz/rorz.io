import { defineSchema, note, type ObsidResolvedNote, p } from "obsid/schema";
import { StringPropertyLinkTypeSchema, type StringPropertyValue } from "obsid/types";
import { webPermalink } from "@/lib/vault/routing.ts";

const dated = {
  date: p.date(),
};

const titled = {
  title: p.text().optional(),
};

const page = note("page", {});

const post = note("post", {
  ...dated,
  ...titled,
});

const place = note("place", {
  ...dated,
  rating: p.number().optional(),
});

const book = note("book", {
  ...dated,
  author: p.text(),
  rating: p.number().optional(),
});

const thing = note("thing", {
  ...dated,
  from: p.text(),
});

const image = note("image", {
  ...dated,
  src: p.text().pipe(StringPropertyLinkTypeSchema).nullish(),
});

const video = note("video", {
  ...dated,
  src: p.text().pipe(StringPropertyLinkTypeSchema).nullish(),
  thumbnail: p.text().pipe(StringPropertyLinkTypeSchema),
});

const project = note("project", {
  ...dated,
  ...titled,
  byline: p.text(),
  image: p.text().pipe(StringPropertyLinkTypeSchema),
  link: p.text().pipe(StringPropertyLinkTypeSchema),
});

const entries = [
  post,
  place,
  book,
  thing,
  image,
  video,
  project,
] as const;

const list = note("list", {
  listOf: p.text(),
});

const listOfLists = note("listOfLists", {
  limitPer: p.number().optional(),
  lists: p.list(),
});

const grid = note("grid", {
  gridOf: p.text(),
});

const gridOfGrids = note("gridOfGrids", {
  grids: p.list(),
});

const model = defineSchema({
  default: page,
  discriminator: "type",
  notes: [
    page,
    book,
    post,
    project,
    place,
    thing,
    image,
    video,
    grid,
    gridOfGrids,
    list,
    listOfLists,
  ],
  routing: {
    permalink: webPermalink,
  },
});

type VaultRenderers = Parameters<typeof model.render>[0];
type VaultRenderer<Kind extends keyof VaultRenderers> = VaultRenderers[Kind];
type VaultRenderContext<Kind extends keyof VaultRenderers> = Parameters<VaultRenderer<Kind>>[0];
type VaultNote = ObsidResolvedNote<typeof model.notes>;
type EntryKind = (typeof entries)[number]["name"];
type VaultEntry = Extract<
  VaultNote,
  {
    readonly kind: EntryKind;
  }
>;

const renderText = (property: StringPropertyValue): string => {
  if (property.type === "string") {
    return property.value;
  }
  if (property.type === "link") {
    return property.label ?? property.url;
  }
  return property.label ?? property.path;
};

const getEntryKind = (property: StringPropertyValue): EntryKind => {
  if (property.type === "string") {
    const definition = entries.find((entry) => entry.name === property.value);

    if (definition) {
      return definition.name;
    }
  }

  throw new Error(`Invalid entry kind: ${property.raw}`);
};

const getCollectionEntryKinds = (property: StringPropertyValue): readonly EntryKind[] => {
  const kind = getEntryKind(property);

  if (kind === "image") {
    return [
      "image",
      "video",
    ];
  }

  return [
    kind,
  ];
};

const getFolderTitle = ({ folder, name }: Pick<VaultNote, "folder" | "name">): string =>
  folder.vaultPath.split("/").at(-1) || name;

export type { VaultEntry, VaultRenderContext, VaultRenderer, VaultRenderers };
export { getCollectionEntryKinds, getEntryKind, getFolderTitle, model, renderText };
