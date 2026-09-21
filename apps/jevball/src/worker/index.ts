import { answerCatalog } from "../answers.ts";
import { askInputSchema } from "../protocol.ts";
import { HttpError, httpStatus, jsonResponse, readJson } from "./http.ts";
import { evaluateQuestion } from "./jev.ts";
import { questionSet, questionSetVersion, selectionPolicy } from "./question-set.ts";
import { selectAnswer } from "./select-answer.ts";

const retryAfterSeconds = "60";

const errorResponse = (error: unknown): Response => {
  const failure =
    error instanceof HttpError
      ? error
      : new HttpError(
          httpStatus.serviceUnavailable,
          "unavailable",
          "Magic-Jev-Ball is temporarily unavailable.",
          {
            cause: error,
          },
        );
  return jsonResponse(
    {
      error: {
        code: failure.code,
        message: failure.message,
      },
    },
    failure.status,
    failure.status === httpStatus.tooManyRequests
      ? {
          "Retry-After": retryAfterSeconds,
        }
      : undefined,
  );
};

const ask = async (request: Request, env: Env): Promise<Response> => {
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw new HttpError(
      httpStatus.forbidden,
      "cross-origin",
      "Use the app's own origin to ask a question.",
    );
  }
  const mediaType = request.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    throw new HttpError(
      httpStatus.unsupportedMediaType,
      "invalid-content-type",
      "Use application/json.",
    );
  }
  const parsed = askInputSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    throw new HttpError(
      httpStatus.badRequest,
      "invalid-input",
      "Provide a question of 1–1000 characters.",
    );
  }
  if (!env.TYPESAFE_API_KEY?.trim()) {
    throw new HttpError(
      httpStatus.serviceUnavailable,
      "not-configured",
      "Magic-Jev-Ball is waiting for its Jev connection.",
    );
  }
  const { success } = await env.ASK_LIMITER.limit({
    key: request.headers.get("CF-Connecting-IP") ?? "local",
  });
  if (!success) {
    throw new HttpError(
      httpStatus.tooManyRequests,
      "rate-limited",
      "Give the ball a moment. Try again in a minute.",
    );
  }
  const startedAt = performance.now();
  const evaluation = await evaluateQuestion(parsed.data, env, request.signal);
  return jsonResponse(selectAnswer(evaluation), httpStatus.ok, {
    "Server-Timing": `jev;dur=${(performance.now() - startedAt).toFixed(1)}`,
  });
};

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const method = pathname === "/api/ask" ? "POST" : "GET";
    if (
      ![
        "/api/ask",
        "/api/answers",
        "/api/question-set",
      ].includes(pathname)
    ) {
      return jsonResponse(
        {
          error: {
            code: "not-found",
            message: "Route not found.",
          },
        },
        httpStatus.notFound,
      );
    }
    if (request.method !== method) {
      return jsonResponse(
        {
          error: {
            code: "method-not-allowed",
            message: `Use ${method}.`,
          },
        },
        httpStatus.methodNotAllowed,
        {
          allow: method,
        },
      );
    }
    try {
      if (pathname === "/api/answers") {
        return jsonResponse({
          answers: answerCatalog,
        });
      }
      if (pathname === "/api/question-set") {
        return jsonResponse({
          model: env.JEV_MODEL,
          policy: selectionPolicy,
          questions: questionSet,
          version: questionSetVersion,
        });
      }
      return await ask(request, env);
    } catch (error) {
      return errorResponse(error);
    }
  },
} satisfies ExportedHandler<Env>;

export default worker;
