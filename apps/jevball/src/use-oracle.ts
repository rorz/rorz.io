import {
  type ChangeEventHandler,
  type SubmitEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { trackQuestion } from "./analytics.ts";
import { askBall } from "./ask.ts";
import type { AskResult } from "./protocol.ts";

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
};

const useQuestionInput = (turning: boolean, reducedMotion: boolean) => {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!(turning && matchMedia("(width < 40rem)").matches)) {
      return;
    }
    const returnToBall = () =>
      window.scrollTo({
        behavior: reducedMotion ? "instant" : "smooth",
        top: 0,
      });
    input.current?.blur();
    returnToBall();
    // Keep the reveal in view as the mobile keyboard closes.
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", returnToBall);
    return () => viewport?.removeEventListener("resize", returnToBall);
  }, [
    turning,
    reducedMotion,
  ]);
  return input;
};

const useOracle = () => {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [phase, setPhase] = useState<"idle" | "turning" | "revealed">("idle");
  const [error, setError] = useState("");
  const reducedMotion = useReducedMotion();
  const input = useQuestionInput(phase === "turning", reducedMotion);
  const reveal = useCallback(() => setPhase("revealed"), []);
  const changeQuestion: ChangeEventHandler<HTMLInputElement> = (event) =>
    setQuestion(event.target.value);
  const reset = () => {
    setPhase("idle");
    setResult(null);
    setQuestion("");
    setError("");
    requestAnimationFrame(() => input.current?.focus());
  };
  const submit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (phase === "turning" || !question.trim()) {
      return;
    }
    setPhase("turning");
    trackQuestion(question);
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
      setPhase("idle");
    }
  };
  return {
    changeQuestion,
    error,
    input,
    phase,
    question,
    reducedMotion,
    reset,
    result,
    reveal,
    submit,
  };
};

export { useOracle };
