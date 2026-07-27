import z from "zod";

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
    type: z.literal("page"),
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

type StringPropertyValue = z.infer<typeof StringPropertyValueSchema>;

const ObsidianPropertyTypeSchema = z.enum([
  "list",
  "text",
  "number",
  "date",
  "date-and-time",
  "checkbox",
]);
export type ObsidianPropertyType = z.infer<typeof ObsidianPropertyTypeSchema>;

const ObsidianPropertyMapSchema = z.record(z.string(), ObsidianPropertyTypeSchema);

export type ObsidianPropertyMap = z.infer<typeof ObsidianPropertyMapSchema>;

export type ObsidianPropertyValueMap = {
  list: StringPropertyValue[];
  text: StringPropertyValue;
  number: number;
  date: Date;
  "date-and-time": Date;
  checkbox: boolean;
};

export type ObsidianParsedProperties<PM extends ObsidianPropertyMap> = {
  -readonly [K in keyof PM]: ObsidianPropertyValueMap[PM[K]];
};
// const ObsidianPropertyValueMapSchema = z.union([]);

// type ObsidianPropertyValueMap = {
//   list: StringPropertyValue[];
//   text: StringPropertyValue;
//   number: number;
//   date: Date;
//   "date-and-time": Date;
//   checkbox: boolean;
// };

// export type ObsidianPropertyType = keyof ObsidianPropertyValueMap;
