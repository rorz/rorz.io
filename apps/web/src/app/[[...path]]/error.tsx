"use client";

interface PageErrorProps {
  readonly error: Error & {
    readonly digest?: string;
  };
  readonly reset: () => void;
}

const PageError = ({ error, reset }: PageErrorProps) => (
  <article className="flex flex-col items-start gap-4">
    <h1 className="text-2xl font-medium tracking-tight">Unable to render this note</h1>
    <pre className="max-w-full whitespace-pre-wrap font-mono text-sm text-neutral-700">
      {error.message}
    </pre>
    <button
      className="cursor-pointer bg-black px-3 py-1.5 text-white hover:bg-neutral-700"
      onClick={reset}
      type="button"
    >
      Try again
    </button>
  </article>
);

export default PageError;
