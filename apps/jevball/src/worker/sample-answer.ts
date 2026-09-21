import type { AnswerId } from "../answers.ts";

interface WeightedAnswer {
  readonly id: AnswerId;
  readonly probability: number;
}

const sampleAnswer = (distribution: readonly WeightedAnswer[]): AnswerId => {
  const draw = Math.random();
  let cumulative = 0;
  let lastPositive: AnswerId | undefined;
  for (const option of distribution) {
    if (option.probability > 0) {
      lastPositive = option.id;
    }
    cumulative += option.probability;
    if (draw < cumulative) {
      return option.id;
    }
  }
  // Normalized floating-point weights can total fractionally less than one.
  if (lastPositive === undefined) {
    throw new Error("At least one answer must have positive weight.");
  }
  return lastPositive;
};

export { sampleAnswer };
