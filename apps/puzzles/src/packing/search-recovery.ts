import type { Placement } from "./model.ts";

type RecoveryEvaluation = {
  radius: number;
  valid: boolean;
};
type RecoveryControl = {
  domainSizes: number[];
  targetRadius: number;
  witnessIncluded: true;
  witnessRadius: number;
};

// Check the actual serialized domains, including the first angle. A baseline
// scoring control alone says nothing about recovering a coupled nearby repair.
const certifyRecovery = (
  domains: Placement[][],
  witness: Placement[],
  evaluation: RecoveryEvaluation,
  targetRadius: number,
): RecoveryControl => {
  if (
    !Number.isFinite(targetRadius) ||
    targetRadius <= 0 ||
    !evaluation.valid ||
    !Number.isFinite(evaluation.radius) ||
    evaluation.radius <= 0 ||
    evaluation.radius > targetRadius
  ) {
    throw new Error("Recovery needs an independently valid, target-meeting witness.");
  }
  if (
    witness.length === 0 ||
    domains.length !== witness.length ||
    !witness.every(
      (point, index) =>
        [
          point.x,
          point.y,
          point.theta,
        ].every(Number.isFinite) &&
        domains[index]?.some(
          (choice) => choice.x === point.x && choice.y === point.y && choice.theta === point.theta,
        ),
    )
  ) {
    throw new Error("The withheld witness is outside the serialized recovery domains.");
  }
  return {
    domainSizes: domains.map((domain) => domain.length),
    targetRadius,
    witnessIncluded: true,
    witnessRadius: evaluation.radius,
  };
};

const recoveryOutcome = (
  control: RecoveryControl,
  outcome: {
    candidate?: RecoveryEvaluation;
    capped: boolean;
    exhausted: boolean;
  },
): "passed" | "capped" => {
  if (outcome.candidate) {
    if (
      outcome.candidate.valid &&
      Number.isFinite(outcome.candidate.radius) &&
      outcome.candidate.radius > 0 &&
      outcome.candidate.radius <= control.targetRadius
    ) {
      return "passed";
    }
    throw new Error("The recovered candidate failed independent validation or its radius target.");
  }
  if (outcome.capped) {
    return "capped";
  }
  throw new Error(
    outcome.exhausted
      ? "Empty recovery result contradicts the certified withheld witness."
      : "Recovery ended without a candidate, a cap, or an exhaustion result.",
  );
};

export { certifyRecovery, recoveryOutcome };
