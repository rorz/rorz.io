"use client";

import "@/styles.css";

interface GlobalErrorProps {
  readonly error: Error & {
    readonly digest?: string;
  };
  readonly reset: () => void;
}

const GlobalError = ({ error, reset }: GlobalErrorProps) => (
  <html lang="en">
    <body className="flex min-h-screen items-center justify-center p-8">
      <main className="flex max-w-xl flex-col items-start gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Unable to render the site</h1>
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
      </main>
    </body>
  </html>
);

export default GlobalError;
