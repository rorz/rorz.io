// biome-ignore-all lint/style/noMagicNumbers: exact-grid withheld-witness regression fixtures.
import { expect, test } from "bun:test";
import { certifyRecovery, recoveryOutcome } from "./search-recovery.ts";

const witness = [
  {
    theta: -0.063,
    x: 0,
    y: 0,
  },
];
const evaluation = {
  radius: 2.9,
  valid: true,
};

test("pinning the first angle cannot silently exclude a known recovery witness", () => {
  const pinned = [
    [
      {
        ...witness[0],
        theta: -0.062_996,
        x: 0,
        y: 0,
      },
    ],
  ];
  expect(() => certifyRecovery(pinned, witness, evaluation, 3)).toThrow("outside");
  expect(
    certifyRecovery(
      [
        witness,
      ],
      witness,
      evaluation,
      3,
    ).witnessIncluded,
  ).toBe(true);
});

test("a certified nonempty recovery box cannot return empty as a successful negative", () => {
  const control = certifyRecovery(
    [
      witness,
    ],
    witness,
    evaluation,
    3,
  );
  expect(() =>
    recoveryOutcome(control, {
      capped: false,
      exhausted: true,
    }),
  ).toThrow("contradicts");
  expect(
    recoveryOutcome(control, {
      capped: true,
      exhausted: false,
    }),
  ).toBe("capped");
});

test("a solver proposal only passes recovery after independent validity and target checks", () => {
  const control = certifyRecovery(
    [
      witness,
    ],
    witness,
    evaluation,
    3,
  );
  expect(() =>
    recoveryOutcome(control, {
      candidate: {
        radius: 2.8,
        valid: false,
      },
      capped: false,
      exhausted: false,
    }),
  ).toThrow("validation");
  expect(() =>
    certifyRecovery(
      [
        witness,
      ],
      witness,
      evaluation,
      2.8,
    ),
  ).toThrow("target-meeting");
  expect(
    recoveryOutcome(control, {
      candidate: evaluation,
      capped: false,
      exhausted: false,
    }),
  ).toBe("passed");
});
