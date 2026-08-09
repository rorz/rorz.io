import { z } from "zod";

const StringPropertyStringTypeSchema = z.object({
  raw: z.string(),
  type: z.literal("string"),
  value: z.string(),
});
const StringPropertyNoteTypeSchema = z.object({
  label: z.string().exactOptional(),
  path: z.string(),
  raw: z.string(),
  type: z.literal("note"),
});
const StringPropertyFileTypeSchema = z.object({
  label: z.string().exactOptional(),
  path: z.string(),
  raw: z.string(),
  type: z.literal("file"),
});
const StringPropertyLinkTypeSchema = z.object({
  label: z.string().exactOptional(),
  raw: z.string(),
  type: z.literal("link"),
  url: z.url(),
});

const StringPropertyValueSchema = z.discriminatedUnion("type", [
  StringPropertyStringTypeSchema,
  StringPropertyNoteTypeSchema,
  StringPropertyLinkTypeSchema,
  StringPropertyFileTypeSchema,
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

export {
  StringPropertyFileTypeSchema,
  StringPropertyLinkTypeSchema,
  StringPropertyNoteTypeSchema,
  StringPropertyStringTypeSchema,
};
