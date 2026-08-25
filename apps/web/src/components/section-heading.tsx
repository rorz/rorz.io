// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";

interface SectionHeadingProps {
  readonly count: number;
  readonly href: string;
  readonly title: string;
}

const SectionHeading = ({ count, href, title }: SectionHeadingProps) => (
  <div className="flex w-full items-baseline gap-2">
    <Link className="underline" href={href}>
      <h2 className="font-semibold text-xl">{title}</h2>
    </Link>
    <Link className="ml-auto text-sm underline underline-offset-2" href={href}>
      View All ({count})
    </Link>
  </div>
);

export { SectionHeading };
