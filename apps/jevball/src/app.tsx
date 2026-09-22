import { lazy, Suspense, useId } from "react";
import { AnswerOptions } from "./answer-options.tsx";
import { InkOutline } from "./ink-outline.tsx";
import { maxQuestionLength } from "./protocol.ts";
import { SpiralIcon } from "./spiral-icon.tsx";
import { useOracle } from "./use-oracle.ts";

const BallScene = lazy(() =>
  import("./scene/ball-scene.tsx").then((module) => ({
    default: module.BallScene,
  })),
);
const longAnswerLength = 19;

const QuestionForm = ({ oracle }: { readonly oracle: ReturnType<typeof useOracle> }) => {
  const questionId = useId();
  const turning = oracle.phase === "turning";
  return (
    <form className="space-y-4" onSubmit={oracle.submit}>
      <label className="sr-only" htmlFor={questionId}>
        Your question
      </label>
      <div className="relative isolate flex flex-col items-center gap-3 sm:flex-row sm:gap-2 sm:p-2 sm:pl-6">
        <div className="group relative isolate w-full px-4 py-2 sm:static sm:min-w-0 sm:flex-1 sm:isolation-auto sm:p-0">
          <InkOutline
            className="fill-zinc-950/60 stroke-white/35 transition-colors group-focus-within:stroke-violet-200/70"
            field={true}
          />
          <input
            autoComplete="off"
            className="w-full min-w-0 bg-transparent py-3 text-base text-zinc-100 outline-none placeholder:text-zinc-400 disabled:opacity-50"
            disabled={turning}
            enterKeyHint="go"
            id={questionId}
            maxLength={maxQuestionLength}
            onChange={oracle.changeQuestion}
            placeholder="Ask a yes-or-no question…"
            ref={oracle.input}
            required={true}
            type="text"
            value={oracle.question}
          />
        </div>
        <button
          aria-label="Ask the ball"
          className="group relative isolate inline-flex shrink-0 items-center gap-2 px-5 py-3 text-base font-bold whitespace-nowrap text-zinc-950 focus-visible:outline-none disabled:cursor-wait disabled:opacity-40"
          disabled={turning || !oracle.question.trim()}
          type="submit"
        >
          <InkOutline className="fill-violet-200 stroke-violet-950/55 transition-colors group-hover:fill-violet-100 group-focus-visible:fill-white group-focus-visible:stroke-zinc-950" />
          Ask
          <SpiralIcon />
        </button>
      </div>
      <p className="text-center text-xs text-zinc-400">Part intelligence, part chance.</p>
    </form>
  );
};

const App = () => {
  const oracle = useOracle();
  const possibilitiesId = useId();
  const revealed = oracle.phase === "revealed";
  const answerSize =
    (oracle.result?.answer.text.length ?? 0) > longAnswerLength
      ? "text-4xl sm:text-5xl lg:text-6xl xl:text-7xl"
      : "text-5xl lg:text-8xl";
  return (
    <main className="relative">
      <section className="relative isolate h-svh min-h-192 overflow-hidden sm:min-h-176">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Suspense fallback={null}>
            <BallScene
              onReveal={oracle.reveal}
              phase={oracle.phase}
              question={oracle.question}
              reducedMotion={oracle.reducedMotion}
              result={oracle.result}
            />
          </Suspense>
        </div>
        <header className="px-3 py-7 sm:px-10">
          <div>
            <h1 className="flex items-center gap-2 font-oracle text-xl text-zinc-100 sm:text-2xl">
              {/* biome-ignore lint/performance/noImgElement: Vite serves this small SVG directly, shared with the favicon. */}
              <img alt="" className="size-10 shrink-0" height="40" src="/icon.svg" width="40" />
              <span className="-translate-y-1 leading-none">Magic Jev Ball</span>
            </h1>
            <p className="-mt-1 pl-12 text-xs text-zinc-400">
              A thing by{" "}
              <a
                className="text-zinc-200 transition hover:text-white"
                href="https://rorz.io/work/magic-jev-ball"
                rel="noreferrer"
                target="_blank"
              >
                Rorz
              </a>
            </p>
          </div>
        </header>
        <div className="pointer-events-none absolute inset-x-0 top-32 px-3 text-center sm:top-28 sm:px-6">
          {!revealed && (
            <p className="font-oracle text-3xl leading-tight text-zinc-100 sm:text-4xl">
              What do you want the answer to?
            </p>
          )}
          <output
            aria-live="polite"
            className={`mx-auto block max-w-5xl font-oracle leading-none text-violet-100 uppercase transition duration-1000 motion-reduce:transition-none ${answerSize} ${revealed ? "translate-y-0 opacity-100 blur-none" : "translate-y-3 opacity-0 blur-sm"}`}
          >
            {revealed ? oracle.result?.answer.text : ""}
          </output>
        </div>
        <div className="absolute inset-x-0 bottom-5 mx-auto max-w-xl px-3 sm:bottom-12 sm:px-6">
          {revealed ? (
            <div className="space-y-5 text-center">
              <p
                className="text-xl leading-snug wrap-anywhere text-balance text-zinc-200 italic sm:text-2xl"
                title={oracle.question}
              >
                “{oracle.question}”
              </p>
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                <button
                  className="group relative isolate inline-flex items-center gap-3 px-6 py-3 text-sm font-bold whitespace-nowrap text-zinc-950 focus-visible:outline-none"
                  onClick={oracle.reset}
                  type="button"
                >
                  <InkOutline className="fill-violet-200 stroke-violet-950/55 transition-colors group-hover:fill-violet-100 group-focus-visible:fill-white group-focus-visible:stroke-zinc-950" />
                  Ask again
                  <SpiralIcon />
                </button>
                <a
                  className="text-xs text-zinc-300 transition hover:text-zinc-100 xl:hidden"
                  href={`#${possibilitiesId}`}
                >
                  Other possibilities <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          ) : (
            <QuestionForm oracle={oracle} />
          )}
          {oracle.error.length > 0 && (
            <p className="mt-4 text-center text-sm text-rose-300" role="alert">
              {oracle.error}
            </p>
          )}
        </div>
      </section>
      {revealed && oracle.result !== null && (
        <section
          className="mx-auto max-w-xl scroll-mt-6 px-3 pt-10 pb-16 transition-opacity delay-300 duration-1000 starting:opacity-0 motion-reduce:delay-0 motion-reduce:transition-none sm:px-6 xl:absolute xl:top-56 xl:right-8 xl:w-64 xl:px-0 xl:py-0 2xl:right-12 2xl:w-72"
          id={possibilitiesId}
        >
          <AnswerOptions result={oracle.result} />
        </section>
      )}
      <footer className="px-3 py-5 text-center font-mono text-xs text-zinc-600 sm:px-6">
        Questions are sent to Jev. Please don't use all my tokens!
      </footer>
    </main>
  );
};

export { App };
