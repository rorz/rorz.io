import { lazy, Suspense, useId } from "react";
import { AnswerOptions } from "./answer-options.tsx";
import { maxQuestionLength } from "./protocol.ts";
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
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-2 pl-6 shadow-2xl backdrop-blur-xl transition focus-within:border-violet-300/50">
        <input
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          disabled={turning}
          id={questionId}
          maxLength={maxQuestionLength}
          onChange={oracle.changeQuestion}
          placeholder="Ask a yes-or-no question…"
          ref={oracle.input}
          required={true}
          type="text"
          value={oracle.question}
        />
        <button
          aria-label="Ask the ball"
          className="shrink-0 rounded-full bg-violet-200 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300 disabled:cursor-wait disabled:opacity-40"
          disabled={turning || !oracle.question.trim()}
          type="submit"
        >
          {turning ? "Turning…" : "Ask ↗"}
        </button>
      </div>
      <p className="text-center text-xs text-zinc-500">One question. Twenty possibilities.</p>
    </form>
  );
};

const App = () => {
  const oracle = useOracle();
  const possibilitiesId = useId();
  const revealed = oracle.phase === "revealed";
  const turning = oracle.phase === "turning";
  const answerSize =
    (oracle.result?.answer.text.length ?? 0) > longAnswerLength
      ? "text-4xl sm:text-5xl lg:text-6xl xl:text-7xl"
      : "text-5xl lg:text-8xl";
  return (
    <main>
      <section className="relative isolate h-svh min-h-176 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-9xl text-zinc-700">
                ⑧
              </div>
            }
          >
            <BallScene
              onReveal={oracle.reveal}
              phase={oracle.phase}
              question={oracle.question}
              reducedMotion={oracle.reducedMotion}
              result={oracle.result}
            />
          </Suspense>
        </div>
        <header className="flex items-center justify-between px-6 py-7 sm:px-10">
          <h1 className="flex items-center gap-3 text-xs tracking-widest text-zinc-300 uppercase">
            <span
              aria-hidden="true"
              className="grid size-6 place-items-center rounded-full border border-zinc-600 font-mono text-sm"
            >
              8
            </span>
            Magic-Jev-Ball
          </h1>
          <span className="hidden font-mono text-xs text-zinc-500 sm:block">
            A little intelligence. A little chance.
          </span>
        </header>
        <div className="pointer-events-none absolute inset-x-0 top-24 px-6 text-center sm:top-28">
          {!revealed && (
            <p className="text-sm tracking-wide text-zinc-400">
              {turning ? "Let's see what surfaces." : "What's on your mind?"}
            </p>
          )}
          <output
            aria-live="polite"
            className={`mx-auto block max-w-5xl font-oracle leading-none text-violet-100 uppercase transition duration-1000 motion-reduce:transition-none ${answerSize} ${revealed ? "translate-y-0 opacity-100 blur-none" : "translate-y-3 opacity-0 blur-sm"}`}
          >
            {revealed ? oracle.result?.answer.text : ""}
          </output>
        </div>
        <div className="absolute inset-x-0 bottom-10 mx-auto max-w-xl px-6 sm:bottom-12">
          {revealed ? (
            <div className="space-y-5 text-center">
              <p className="line-clamp-2 text-sm text-zinc-400" title={oracle.question}>
                “{oracle.question}”
              </p>
              <div className="flex items-center justify-center gap-6">
                <button
                  className="rounded-full bg-violet-200 px-6 py-3 text-sm font-medium text-zinc-950 transition hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300"
                  onClick={oracle.reset}
                  type="button"
                >
                  Ask again{" "}
                  <span aria-hidden="true" className="ml-2">
                    ↗
                  </span>
                </button>
                <a
                  className="text-xs text-zinc-400 transition hover:text-zinc-100"
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
        <section className="mx-auto max-w-xl scroll-mt-6 px-6 pt-10 pb-16" id={possibilitiesId}>
          <AnswerOptions result={oracle.result} />
        </section>
      )}
      <footer className="px-6 py-5 text-center font-mono text-xs text-zinc-600">
        Questions are sent to TypeSafe AI. The future remains yours.
      </footer>
    </main>
  );
};

export { App };
