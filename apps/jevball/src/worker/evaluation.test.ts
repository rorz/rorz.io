// biome-ignore-all lint/style/useNamingConvention: Token usage fields follow the TypeSafe API.
import { expect, test } from "bun:test";
import { answerCatalog } from "../answers.ts";
import { evaluationSchema } from "./evaluation.ts";

const evaluation = {
  answers: {
    reply: {
      choice: "it-is-certain",
      confidence: 1,
      probabilities: Object.fromEntries(
        answerCatalog.map(({ id }) => [
          id,
          id === "it-is-certain" ? 1 : 0,
        ]),
      ),
      type: "choice",
    },
  },
  model: "jev-1.13.0",
};

test("accepts unavailable token counts from the TypeSafe 0.7 response contract", () => {
  const response = {
    ...evaluation,
    usage: {
      input_tokens: null,
      output_tokens: 0,
    },
  };
  expect(evaluationSchema.parse(response).usage).toEqual(response.usage);
  expect(
    evaluationSchema.parse({
      ...evaluation,
      usage: {
        input_tokens: 0,
        output_tokens: null,
      },
    }).usage.output_tokens,
  ).toBeNull();
});

test("still rejects invalid token counts when unavailable usage is allowed", () => {
  expect(
    evaluationSchema.safeParse({
      ...evaluation,
      usage: {
        input_tokens: -1,
        output_tokens: null,
      },
    }).success,
  ).toBe(false);
});
