import type { ReactNode } from "react";
import { type ObsidSchemaShape, renderObsidPage } from "../config/schema.ts";
import type { ObsidProps } from "./types.ts";

const Obsid = <Schema extends ObsidSchemaShape>({ note, schema }: ObsidProps<Schema>): ReactNode =>
  renderObsidPage(schema, note);

export { Obsid };
