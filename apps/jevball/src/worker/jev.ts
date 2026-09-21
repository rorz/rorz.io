import {
  APITimeoutError,
  APIUserAbortError,
  RateLimitError,
  TypeSafeClient,
} from "@typesafe-ai/sdk";
import type { AskInput } from "../protocol.ts";
import { evaluationSchema } from "./evaluation.ts";
import { HttpError, httpStatus } from "./http.ts";
import { questionSet } from "./question-set.ts";

const attemptTimeoutMs = 5000;
const totalTimeoutMs = 12_000;
const retryDelayLimitMs = 1000;

const evaluateQuestion = async (input: AskInput, env: Env, requestSignal: AbortSignal) => {
  if (requestSignal.aborted) {
    throw new HttpError(httpStatus.gatewayTimeout, "jev-timeout", "The request was cancelled.");
  }
  const client = new TypeSafeClient({
    apiKey: env.TYPESAFE_API_KEY,
    // biome-ignore lint/style/useNamingConvention: This property belongs to the TypeSafe SDK.
    baseURL: "https://api.typesafe.ai",
    defaultModel: env.JEV_MODEL,
    logLevel: "off",
    retry: {
      maxRetries: 1,
      maxRetryAfterMs: retryDelayLimitMs,
    },
    timeout: attemptTimeoutMs,
  });

  try {
    const response = await client.systemOne(
      {
        questions: questionSet,
        state: input,
      },
      {
        signal: AbortSignal.any([
          requestSignal,
          AbortSignal.timeout(totalTimeoutMs),
        ]),
      },
    );
    return evaluationSchema.parse(response);
  } catch (error) {
    if (error instanceof APITimeoutError || error instanceof APIUserAbortError) {
      // biome-ignore lint/style/useErrorCause: HttpError forwards its fourth argument to ErrorOptions.
      throw new HttpError(
        httpStatus.gatewayTimeout,
        "jev-timeout",
        "Jev took too long to respond. Try again.",
        {
          cause: error,
        },
      );
    }
    if (error instanceof RateLimitError) {
      // biome-ignore lint/style/useErrorCause: HttpError forwards its fourth argument to ErrorOptions.
      throw new HttpError(
        httpStatus.serviceUnavailable,
        "jev-busy",
        "Jev is busy. Try again shortly.",
        {
          cause: error,
        },
      );
    }
    // Never forward the provider's body, headers, credentials, or raw input to the client or logs.
    // biome-ignore lint/style/useErrorCause: HttpError forwards its fourth argument to ErrorOptions.
    throw new HttpError(
      httpStatus.badGateway,
      "jev-unavailable",
      "Jev could not provide a valid answer. Try again.",
      {
        cause: error,
      },
    );
  }
};

export { evaluateQuestion };
