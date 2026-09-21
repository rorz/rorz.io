import { answerCatalog } from "../answers.ts";
import { type Evaluation, normalizeProbabilities } from "./evaluation.ts";
import { questionSetVersion } from "./question-set.ts";
import { sampleAnswer } from "./sample-answer.ts";

const selectAnswer = (evaluation: Evaluation) => {
  const probabilities = normalizeProbabilities(evaluation.answers.reply.probabilities);
  const distribution = answerCatalog.map((candidate) => ({
    ...candidate,
    probability: probabilities[candidate.id] ?? 0,
  }));
  const selectedId = sampleAnswer(distribution);
  const answer = answerCatalog.find((candidate) => candidate.id === selectedId);
  if (!answer) {
    throw new Error("The selected answer is not in the catalogue.");
  }

  return {
    answer,
    diagnostics: {
      evaluation,
      questionSetVersion,
    },
    distribution,
  };
};

export { selectAnswer };
