import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";

interface EntryNavigationItem {
  readonly href: string;
  readonly title: string;
}

interface EntryNavigationProps {
  readonly next?: EntryNavigationItem;
  readonly previous?: EntryNavigationItem;
}

const EntryNavigation = ({ next, previous }: EntryNavigationProps) => {
  if (!(previous || next)) {
    return null;
  }

  return (
    <nav aria-label="Entry navigation" className="mt-6 flex w-full items-center gap-4">
      {previous ? (
        <Link
          aria-label={`Previous: ${previous.title}`}
          className="inline-flex items-center gap-1 underline underline-offset-2"
          href={previous.href}
          rel="prev"
        >
          <CaretLeftIcon aria-hidden={true} />
          {previous.title}
        </Link>
      ) : null}
      {next ? (
        <Link
          aria-label={`Next: ${next.title}`}
          className="ml-auto inline-flex items-center gap-1 text-right underline underline-offset-2"
          href={next.href}
          rel="next"
        >
          {next.title}
          <CaretRightIcon aria-hidden={true} />
        </Link>
      ) : null}
    </nav>
  );
};

export { EntryNavigation };
