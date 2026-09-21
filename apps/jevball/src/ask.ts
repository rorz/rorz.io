import { type AskInput, type AskResult, apiErrorSchema, askResultSchema } from "./protocol.ts";

const askBall = async (input: AskInput): Promise<AskResult> => {
  const response = await fetch("/api/ask", {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const failure = apiErrorSchema.safeParse(body);
    throw new Error(
      failure.success ? failure.data.error.message : "The ball is unavailable. Try again.",
    );
  }
  return askResultSchema.parse(body);
};

export { askBall };
