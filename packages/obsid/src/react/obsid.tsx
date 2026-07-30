import type { ReactNode } from "react";
import { type ObsidRenderedSchemaShape, renderObsidPage } from "../config/schema.ts";
import type { ObsidProps } from "./types.ts";

const Obsid = <Schema extends ObsidRenderedSchemaShape>({
  note,
  schema,
}: ObsidProps<Schema>): ReactNode => renderObsidPage(schema, note);

export { Obsid };
