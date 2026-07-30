import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
import type { FC, ReactNode } from "react";

type PageProps = {
  title?: string;
  subtitle?: string | ReactNode;
  children: ReactNode;
  backNavigation?: {
    title: string;
    href: string;
  };
};

export const Page: FC<PageProps> = ({ children, ...props }) => {
  const backNavigation = props.backNavigation ? (
    <Link
      className="inline-flex items-center gap-1 text-sm hover:underline mb-3"
      href={props.backNavigation.href}
    >
      <ArrowLeftIcon />
      <span>{props.backNavigation.title}</span>
    </Link>
  ) : null;

  const title = props.title ? (
    <h1 className="font-sans font-stretch-semi-condensed font-bold text-3xl">{props.title}</h1>
  ) : null;

  const subtitle = (() => {
    if (props.subtitle === undefined) {
      return null;
    }
    if (typeof props.subtitle === "string") {
      return <span className="mb-4 text-neutral-700">{props.subtitle}</span>;
    }
    return props.subtitle;
  })();

  return (
    <div className="flex flex-col gap-2 items-start">
      {backNavigation}
      {title}
      {subtitle}
      {children}
    </div>
  );
};
