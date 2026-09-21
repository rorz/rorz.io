import { z } from "zod";
import { answerCatalog } from "../answers.ts";

const probabilitySchema = z.number().min(0).max(1);
// Live Jev responses round each probability to two decimal places; totals can be 0.99 or 1.01.
const halfRoundingUnit = 0.005;

const normalizeProbabilities = (probabilities: Readonly<Record<string, number>>) => {
  const total = Object.values(probabilities).reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Answer weights must have a positive finite total.");
  }
  return Object.fromEntries(
    Object.entries(probabilities).map(([key, value]) => [
      key,
      value / total,
    ]),
  );
};

const answerIds = answerCatalog.map((answer) => answer.id);
const answerChoiceSchema = z
  .object({
    choice: z.enum(answerIds),
    confidence: probabilitySchema,
    probabilities: z.record(z.enum(answerIds), probabilitySchema),
    type: z.literal("choice"),
  })
  .refine((answer) => {
    const values = Object.values(answer.probabilities);
    const total = values.reduce((sum, value) => sum + value, 0);
    const selected = answer.probabilities[answer.choice] ?? -1;
    return (
      Math.abs(total - 1) <= answerIds.length * halfRoundingUnit + Number.EPSILON &&
      selected >= Math.max(...values)
    );
  }, "Choice probabilities must sum to one and the choice must be a maximum.");

// The SDK provides compile-time types; this validates the actual network response.
const evaluationSchema = z.object({
  answers: z.object({
    reply: answerChoiceSchema,
  }),
  model: z.string().min(1),
  usage: z.object({
    // biome-ignore lint/style/useNamingConvention: The TypeSafe API uses snake_case.
    input_tokens: z.int().nonnegative(),
    // biome-ignore lint/style/useNamingConvention: The TypeSafe API uses snake_case.
    output_tokens: z.int().nonnegative(),
  }),
});

type Evaluation = z.infer<typeof evaluationSchema>;

export type { Evaluation };
export { evaluationSchema, normalizeProbabilities };
