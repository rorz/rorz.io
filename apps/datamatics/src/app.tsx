import { useCallback, useEffect, useRef } from "react";
import { drawArtwork, SCENE_HEIGHT, SCENE_WIDTH } from "./artwork.ts";

const downloadPng = (canvas: HTMLCanvasElement) => {
  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "datamatics.png";
    link.href = url;
    document.body.append(link);
    link.click();
    link.remove();
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
};

const App = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) {
      drawArtwork(ctx);
    }
  }, []);

  useEffect(draw, [
    draw,
  ]);

  const download = () => {
    if (canvas.current) {
      downloadPng(canvas.current);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-5 pt-5 sm:px-8 sm:pt-7">
        <p className="max-w-prose text-left font-thin text-base text-zinc-200 leading-relaxed sm:text-lg">
          This is an experiment I worked on in order to create the hero image on{" "}
          <a
            className="underline decoration-zinc-500 underline-offset-4 hover:decoration-current focus-visible:outline-offset-4"
            href="https://linkedin.com/in/rorz"
            rel="noreferrer"
            target="_blank"
          >
            my LinkedIn profile
          </a>
          , inspired by{" "}
          <a
            className="underline decoration-zinc-500 underline-offset-4 hover:decoration-current focus-visible:outline-offset-4"
            href="https://www.ryojiikeda.com/project/datamatics/"
            rel="noreferrer"
            target="_blank"
          >
            Ryoji Ikeda's datamatics
          </a>{" "}
          work.
        </p>
      </header>
      <main className="flex w-full flex-1 flex-col items-center justify-center py-6">
        <canvas
          aria-label="A generated composition of bars and glyphs with red accents"
          className="h-auto max-w-full bg-black"
          height={SCENE_HEIGHT}
          ref={canvas}
          role="img"
          width={SCENE_WIDTH}
        />
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            className="rounded border border-white/20 px-3 py-1.5 font-light text-white/70 text-xs transition hover:border-white/50 hover:text-white"
            onClick={download}
            type="button"
          >
            Download PNG
          </button>
          <button
            className="rounded border border-white/20 bg-white px-3 py-1.5 font-light text-black/70 text-xs transition hover:border-white/50 hover:text-red-500"
            onClick={draw}
            type="button"
          >
            Refresh
          </button>
        </div>
      </main>
      <footer className="px-5 pb-5 text-center">
        <a
          className="inline-block py-1 text-xs text-zinc-400 underline decoration-zinc-600 underline-offset-4 hover:text-zinc-200 focus-visible:outline-offset-4"
          href="https://github.com/rorz/rorz.io/tree/main/apps/datamatics"
          rel="noreferrer"
          target="_blank"
        >
          Code is open-source and available here.
        </a>
      </footer>
    </div>
  );
};

export { App };
