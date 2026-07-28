import { z } from "zod";

interface FrontmatterSource {
  readonly frontmatter: unknown;
  readonly vaultPath: string;
}

const dateSchema = z.iso.date();
const displayAsKey = "display_as";

const vaultLinkSchema = z.object({
  label: z.string(),
  resolvedPath: z.string().nullable(),
  target: z.string(),
  type: z.literal("link"),
});

const frontmatterProperties = {
  date: dateSchema.optional(),
  directories: z.array(vaultLinkSchema).optional(),
  slug: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
};

const defaultFrontmatterSchema = z.object({
  ...frontmatterProperties,
  [displayAsKey]: z.undefined().optional(),
});

const linkListFrontmatterSchema = z.object({
  ...frontmatterProperties,
  [displayAsKey]: z.literal("link-list"),
});

const frontmatterSchema = z.discriminatedUnion(displayAsKey, [
  defaultFrontmatterSchema,
  linkListFrontmatterSchema,
]);

const rootFrontmatterSchema = defaultFrontmatterSchema.extend({
  directories: z.array(vaultLinkSchema),
});

const linkListEntryFrontmatterSchema = defaultFrontmatterSchema.extend({
  date: dateSchema,
});

const parseFrontmatter = <Schema extends z.ZodType>(
  file: FrontmatterSource,
  schema: Schema,
): z.output<Schema> => {
  const result = schema.safeParse(file.frontmatter);

  if (!result.success) {
    throw new Error(
      `Invalid frontmatter in ${file.vaultPath}.md\n${z.prettifyError(result.error)}`,
      {
        cause: result.error,
      },
    );
  }

  return result.data;
};

export {
  frontmatterSchema,
  linkListEntryFrontmatterSchema,
  parseFrontmatter,
  rootFrontmatterSchema,
};
