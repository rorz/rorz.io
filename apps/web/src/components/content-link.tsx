import { ArrowSquareOutIcon, NoteIcon } from "@phosphor-icons/react/ssr";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn/index.ts";

interface ContentLinkProps {
  readonly children?: ReactNode;
  readonly className?: string | undefined;
  readonly href: string;
}

const contentLinkClassName = "inline-flex items-center gap-1 underline font-medium";

const InternalLink = ({ children, className, href }: ContentLinkProps) => (
  <Link className={cn(contentLinkClassName, className)} href={href}>
    <span>{children}</span>
    <NoteIcon aria-hidden={true} />
  </Link>
);

const ExternalLink = ({ children, className, href }: ContentLinkProps) => (
  <a className={cn(contentLinkClassName, className)} href={href} rel="noopener" target="_blank">
    <span>{children}</span>
    <ArrowSquareOutIcon aria-hidden={true} />
  </a>
);

export { ExternalLink, InternalLink };
