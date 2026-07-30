import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { defineSchema, note, p } from "../config/schema.ts";
import { getFileFromLoaders } from "../vault/file-store.ts";
import { Obsid } from "./obsid.tsx";

test("renders a note with its selected schema renderer", async () => {
  const page = note("page", {
    title: p.string(),
  });
  const model = defineSchema({
    default: page,
    notes: [
      page,
    ],
  });
  const schema = model.render({
    page: ({ note: current }) => (
      <article>
        <h1>{current.data.title ?? current.name}</h1>
        <p>{current.body}</p>
      </article>
    ),
  });
  const resolved = await getFileFromLoaders(
    {
      "/.obsidian-vaults/notes/page.md": () =>
        Promise.resolve(`---
title: Welcome
---
Hello from Markdown`),
    },
    "./.obsidian-vaults/",
    "notes",
    "page",
    schema,
  );

  if (!resolved) {
    throw new Error("Expected page to resolve");
  }

  const html = renderToStaticMarkup(<Obsid note={resolved} schema={schema} />);

  expect(html).toContain("<h1>Welcome</h1>");
  expect(html).toContain("<p>Hello from Markdown</p>");
});
