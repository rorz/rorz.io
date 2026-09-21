import { type ChangeEventHandler, type SubmitEventHandler, useState } from "react";
import { AnswerOptions } from "./answer-options.tsx";
import { askBall } from "./ask.ts";
import { type AskResult, maxQuestionLength } from "./protocol.ts";

const App = () => {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const changeQuestion: ChangeEventHandler<HTMLTextAreaElement> = (event) =>
    setQuestion(event.target.value);

  const submit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (pending) {
      return;
    }
    setPending(true);
    setResult(null);
    setError("");
    try {
      setResult(
        await askBall({
          question,
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The ball is unavailable. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="font-mono text-xs tracking-widest text-violet-300 uppercase">
          Twenty possibilities
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Magic-Jev-Ball</h1>
        <p className="text-zinc-400">Ask a yes-or-no question. Let the ball weigh in.</p>
      </header>
      <form className="space-y-5" onSubmit={submit}>
        <label className="block space-y-2">
          <span className="text-sm text-zinc-300">Your question</span>
          <textarea
            className="block min-h-24 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 focus-visible:outline-2 focus-visible:outline-violet-400"
            disabled={pending}
            maxLength={maxQuestionLength}
            onChange={changeQuestion}
            placeholder="Will this plan work?"
            required={true}
            value={question}
          />
        </label>
        <button
          className="rounded-full bg-violet-300 px-6 py-3 font-medium text-zinc-950 transition hover:bg-violet-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400 disabled:cursor-wait disabled:opacity-50"
          disabled={pending || !question.trim()}
          type="submit"
        >
          {pending ? "Consulting Jev…" : "Ask the ball"}
        </button>
      </form>
      <div className="space-y-6">
        <output aria-live="polite" className="block min-h-20 text-3xl font-medium text-violet-200">
          {result?.answer.text}
          {result?.mode === "playful" && (
            <span className="mt-3 block text-xs font-normal text-zinc-500">A playful nudge.</span>
          )}
        </output>
        {result !== null && <AnswerOptions result={result} />}
      </div>
      {error.length > 0 && (
        <p className="text-sm text-rose-300" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-zinc-500">
        Your question is sent to TypeSafe AI to help the ball answer.
      </p>
    </main>
  );
};

export { App };
