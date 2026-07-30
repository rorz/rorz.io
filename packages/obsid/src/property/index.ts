import { z } from "zod";
import type { ObsidianNotePropertyValue, StringPropertyValue } from "../types/frontmatter.ts";

interface NoteTarget<Name extends string = string> {
  readonly name: Name;
}

declare const referenceTargetType: unique symbol;

type NoteReference<Target extends NoteTarget = NoteTarget> = ObsidianNotePropertyValue & {
  readonly [referenceTargetType]: Target;
};

const referenceTargets = new WeakMap<object, NoteTarget>();

const markdownLinkPattern = /^\[([^\]\n]*)\]\(([^)\n]+)\)$/u;
const wikiLinkPattern = /^(!)?\[\[([^\]\n]+)\]\]$/u;

const withOptionalLabel = <const Value extends object>(
  value: Value,
  label: string | undefined,
): Value & {
  readonly label?: string;
} => {
  if (label === undefined) {
    return value;
  }

  return {
    ...value,
    label,
  };
};

const parseWikiLink = (raw: string): StringPropertyValue | null => {
  const match = wikiLinkPattern.exec(raw);

  if (!match) {
    return null;
  }

  const linkBody = match[2] ?? "";
  const separatorIndex = linkBody.indexOf("|");
  let path = linkBody;
  let label: string | undefined;

  if (separatorIndex !== -1) {
    path = linkBody.slice(0, separatorIndex);
    label = linkBody.slice(separatorIndex + 1).trim() || undefined;
  }

  path = path.trim();

  if (!path) {
    return null;
  }

  if (match[1] === "!") {
    return withOptionalLabel(
      {
        path,
        raw,
        type: "file",
      },
      label,
    );
  }

  return withOptionalLabel(
    {
      path,
      raw,
      type: "note",
    },
    label,
  );
};

const parseMarkdownLink = (raw: string): StringPropertyValue | null => {
  const match = markdownLinkPattern.exec(raw);

  if (!match) {
    return null;
  }

  const parsedUrl = z.url().safeParse(match[2]);

  if (!parsedUrl.success) {
    return null;
  }

  return withOptionalLabel(
    {
      raw,
      type: "link",
      url: parsedUrl.data,
    },
    match[1]?.trim() || undefined,
  );
};

const parseText = (raw: string): StringPropertyValue => {
  const structuredValue = parseWikiLink(raw) ?? parseMarkdownLink(raw);

  if (structuredValue) {
    return structuredValue;
  }

  const parsedUrl = z.url().safeParse(raw);

  if (parsedUrl.success) {
    return {
      raw,
      type: "link",
      url: parsedUrl.data,
    };
  }

  return {
    raw,
    type: "string",
    value: raw,
  };
};

const checkbox = () => z.boolean();
const date = () => z.iso.date().transform((value) => new Date(value));
const dateAndTime = () => z.iso.datetime().transform((value) => new Date(value));
const kind = <
  const Targets extends readonly [
    NoteTarget,
    ...NoteTarget[],
  ],
>(
  ...targets: Targets
): z.ZodType<Targets[number]["name"]> => {
  const names = targets.map((target) => target.name);

  if (new Set(names).size !== names.length) {
    throw new Error("Note kinds must be unique");
  }

  return z.enum(
    names as [
      string,
      ...string[],
    ],
  ) as z.ZodType<Targets[number]["name"]>;
};
const list = () => z.array(z.string().transform(parseText));
const number = () => z.number();
const ref = <const Target extends NoteTarget>(target: Target): z.ZodType<NoteReference<Target>> =>
  z.string().transform((raw, context) => {
    const parsed = parseWikiLink(raw);

    if (parsed?.type !== "note") {
      context.addIssue({
        code: "custom",
        message: "Expected an Obsidian note reference",
      });
      return z.NEVER;
    }

    const reference = parsed as NoteReference<Target>;
    referenceTargets.set(reference, target);
    return reference;
  });
const string = () => z.string();
const text = () => z.string().transform(parseText);

const getNoteReferenceTarget = <Target extends NoteTarget>(
  reference: NoteReference<Target>,
): Target => {
  const target = referenceTargets.get(reference);

  if (!target) {
    throw new Error("Note reference is missing its target kind");
  }

  return target as Target;
};

const p = {
  boolean: checkbox,
  date,
  dateTime: dateAndTime,
  kind,
  number,
  ref,
  string,
} as const;

export type { NoteReference, NoteTarget };
export {
  checkbox,
  date,
  dateAndTime,
  getNoteReferenceTarget,
  kind,
  list,
  number,
  p,
  ref,
  string,
  text,
};
