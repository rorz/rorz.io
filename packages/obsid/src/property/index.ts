import { z } from "zod";
import type { StringPropertyValue } from "../types/frontmatter.ts";

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
const list = () => z.array(z.string().transform(parseText));
const number = () => z.number();
const text = () => z.string().transform(parseText);

const p = {
  checkbox,
  date,
  dateAndTime,
  list,
  number,
  text,
} as const;

export { checkbox, date, dateAndTime, list, number, p, text };
