import { ArrowSquareOutIcon, NoteIcon } from "@phosphor-icons/react/ssr";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
import type { ObsidNoteDefinitions, ObsidQuery } from "obsid/schema";
import type { StringPropertyValue } from "obsid/types";
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
      <Link
        className={cn("inline-flex items-center gap-1 underline font-medium", className)}
        href={result.webPath}
      >
        <span>{result.name}</span>
        <NoteIcon />
      </Link>
    );
  }
  if (value.type === "link") {
    return (
      <a
        className={cn("inline-flex items-center gap-1 underline font-medium", className)}
        href={value.url}
        rel="noopener"
        target="_blank"
      >
        <span>{value.label ?? value.url.toString()}</span>
        <ArrowSquareOutIcon />
      </a>
    );
  }
  if (value.type === "string") {
    return <span className={cn("font-medium", className)}>{value.value}</span>;
  }
  return <p>UNSUPPORTED_UNFURL_TYPE</p>;
};
