import type { ObsidNoteDefinitions, ObsidQuery } from "obsid/schema";
import type { StringPropertyValue } from "obsid/types";
import { ExternalLink, InternalLink } from "@/components/content-link.tsx";
import { cn } from "@/lib/cn/index.ts";

type OmniLinkProps<Definitions extends ObsidNoteDefinitions> = {
  value: StringPropertyValue;
  query: ObsidQuery<Definitions>;
  className?: string;
};

export const OmniLink = async <Definitions extends ObsidNoteDefinitions>({
  value,
  query,
  className,
}: OmniLinkProps<Definitions>) => {
  if (value.type === "note") {
    const result = await query.resolve(value);
    if (result === null) {
      return <p>No Note</p>;
    }
    return (
      <InternalLink className={className} href={result.webPath}>
        {result.name}
      </InternalLink>
    );
  }
  if (value.type === "link") {
    return (
      <ExternalLink className={className} href={value.url.toString()}>
        {value.label ?? value.url.toString()}
      </ExternalLink>
    );
  }
  if (value.type === "string") {
    return <span className={cn("font-medium", className)}>{value.value}</span>;
  }
  return <p>UNSUPPORTED_UNFURL_TYPE</p>;
};
