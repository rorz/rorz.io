import { z } from "zod";
import { answerCatalog, answerGroups } from "./answers.ts";

const maxQuestionLength = 1000;
const askInputSchema = z.strictObject({
  question: z.string().trim().min(1).max(maxQuestionLength),
});

const answerSchema = z.object({
  faceIndex: z
    .int()
    .min(0)
    .max(answerCatalog.length - 1),
  group: z.enum(answerGroups),
  id: z.enum(answerCatalog.map((answer) => answer.id)),
  text: z.string(),
});

// Full model diagnostics stay available over the API.
const askResultSchema = z.object({
  answer: answerSchema,
  distribution: z
    .array(
      answerSchema.extend({
        probability: z.number().min(0).max(1),
      }),
    )
    .length(answerCatalog.length),
  mode: z.enum([
    "evidence",
    "playful",
  ]),
});
const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
type AskInput = z.infer<typeof askInputSchema>;
type AskResult = z.infer<typeof askResultSchema>;

export type { AskInput, AskResult };
export { apiErrorSchema, askInputSchema, askResultSchema, maxQuestionLength };
