import { z } from "zod";

const StringPropertyValueSchema = z.discriminatedUnion("type", [
  z.object({
    raw: z.string(),
    type: z.literal("string"),
    value: z.string(),
  }),
  z.object({
    label: z.string().exactOptional(),
    path: z.string(),
    raw: z.string(),
    type: z.literal("note"),
  }),
  z.object({
    label: z.string().exactOptional(),
    path: z.string(),
    raw: z.string(),
    type: z.literal("file"),
  }),
  z.object({
    label: z.string().exactOptional(),
    raw: z.string(),
    type: z.literal("link"),
    url: z.url(),
  }),
]);

type StringPropertyValue = z.output<typeof StringPropertyValueSchema>;
type ObsidianNotePropertyValue = Extract<
  StringPropertyValue,
  {
    readonly type: "note";
  }
>;

const ObsidianPropertyTypeSchema = z.enum([
  "list",
  "text",
  "number",
  "date",
  "date-and-time",
  "checkbox",
]);
type ObsidianPropertyType = z.output<typeof ObsidianPropertyTypeSchema>;

type ObsidianPropertyValueMap = {
  "date-and-time": Date;
  checkbox: boolean;
  date: Date;
  list: StringPropertyValue[];
  number: number;
  text: StringPropertyValue;
};

type ObsidianPropertyMap = Readonly<Record<string, z.ZodType>>;

type ObsidianParsedProperties<PropertyMap extends ObsidianPropertyMap> = z.output<
  z.ZodObject<PropertyMap>
>;

export type {
  ObsidianNotePropertyValue,
  ObsidianParsedProperties,
  ObsidianPropertyMap,
  ObsidianPropertyType,
  ObsidianPropertyValueMap,
  StringPropertyValue,
};
