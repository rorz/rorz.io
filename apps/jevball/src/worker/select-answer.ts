import { answerCatalog, answerGroups } from "../answers.ts";
import { type Evaluation, normalizeProbabilities } from "./evaluation.ts";
import { questionSetVersion, selectionPolicy } from "./question-set.ts";
import { sampleAnswer } from "./sample-answer.ts";

const sumByGroup = (probabilities: Readonly<Record<string, number>>) =>
  Object.fromEntries(
    answerGroups.map((group) => [
      group,
      answerCatalog
        .filter((answer) => answer.group === group)
        .reduce((sum, answer) => sum + (probabilities[answer.id] ?? 0), 0),
    ]),
  );

// Temperature preserves ordering and zero weights. Optimism tilts the yes faces as a whole.
const temperPlayful = (probabilities: Readonly<Record<string, number>>) =>
  normalizeProbabilities(
    Object.fromEntries(
      answerCatalog.map((answer) => [
        answer.id,
        (probabilities[answer.id] ?? 0) ** (1 / selectionPolicy.temperature) *
          (answer.group === "yes" ? selectionPolicy.optimism : 1),
      ]),
    ),
  );

const selectAnswer = (evaluation: Evaluation) => {
  const { evidence, intent, playful } = evaluation.answers;
  const evidenceProbabilities = normalizeProbabilities(evidence.probabilities);
  const intentProbabilities = normalizeProbabilities(intent.probabilities);
  // Agreement across synonymous faces is evidence about the direction, even if no phrase dominates.
  const evidenceByGroup = sumByGroup(evidenceProbabilities);
  const decisiveEvidence =
    Math.max(evidenceByGroup.yes ?? 0, evidenceByGroup.no ?? 0) >=
    selectionPolicy.evidenceOverrideProbability;
  const eligible =
    intent.choice === "playful" &&
    (intentProbabilities.playful ?? 0) >= selectionPolicy.minimumPlayfulProbability &&
    (intentProbabilities.consequential ?? 0) <= selectionPolicy.maximumConsequentialProbability;
  const playfulWeight = eligible && !decisiveEvidence ? selectionPolicy.playfulness : 0;

  // There is no uniform prior: every positive weight originates in one of Jev's two distributions.
  const playfulProbabilities = temperPlayful(playful.probabilities);
  const distribution = answerCatalog.map((candidate) => ({
    ...candidate,
    probability:
      (1 - playfulWeight) * (evidenceProbabilities[candidate.id] ?? 0) +
      playfulWeight * (playfulProbabilities[candidate.id] ?? 0),
  }));
  const isPlayful = playfulWeight > 0;
  const selectedId = isPlayful ? sampleAnswer(distribution) : evidence.choice;
  const answer = answerCatalog.find((candidate) => candidate.id === selectedId);
  if (!answer) {
    throw new Error("The selected answer is not in the catalogue.");
  }

  return {
    answer,
    diagnostics: {
      evaluation,
      policy: selectionPolicy,
      questionSetVersion,
      selection: {
        decisiveEvidence,
        eligible,
        evidenceByGroup,
        playfulWeight,
      },
    },
    distribution,
    mode: isPlayful ? "playful" : "evidence",
  };
};

export { selectAnswer };
