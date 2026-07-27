import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { defineObsidSchema } from "../config/schema.ts";
import { text } from "../property/index.ts";
import { Obsid } from "./obsid.tsx";

test("renders a note with its selected schema renderer", () => {
  const schema = defineObsidSchema({
    defaultType: "page",
    registry: {
      page: {
        properties: {
          title: text(),
        },
        renderer: ({ title }, { markdown }) => {
          if (title.type !== "string") {
            throw new Error("Expected a plain text title");
          }

          return (
            <article>
              <h1>{title.value}</h1>
              <p>{markdown}</p>
            </article>
          );
        },
      },
    },
  });

  const html = renderToStaticMarkup(
    <Obsid
      note={{
        body: "Hello from Markdown",
        currentFolder: {
          kind: "folder",
          path: "",
        },
        pageType: "page",
        path: "page",
        properties: {
          title: {
            raw: "Welcome",
            type: "string",
            value: "Welcome",
          },
        },
        resolveFolder: () => Promise.resolve([]),
        resolveNote: () => Promise.resolve(null),
      }}
      schema={schema}
    />,
  );

  expect(html).toContain("<h1>Welcome</h1>");
  expect(html).toContain("<p>Hello from Markdown</p>");
});
