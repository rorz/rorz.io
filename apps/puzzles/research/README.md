# Semicircle packing research journal

Consolidated on **2026-10-30**. Dates below follow the saved UTC records. This is the campaign's working account: what ran, which results survived validation, what was corrected, and which questions remain open. The [app README](../README.md) documents the editor and its current search controls.

## Current position

Our best saved **officially validated candidate has radius `2.9485270638716834`**, from exact-tempering worker **2855**, recorded on October 27. No later experiment in this journal improved that score. There is no proof that this arrangement is locally or globally optimal.

| Record                             | Repository snapshot                                          |
| ---------------------------------- | ------------------------------------------------------------ |
| Six-decimal coordinates            | [best/placements.json](best/placements.json)                 |
| Original coordinate JSON bytes     | [best/placements.original.txt](best/placements.original.txt) |
| Editable fan scene                 | [best/scene.json](best/scene.json)                           |
| Saved official validation response | [best/validation.json](best/validation.json)                 |
| Score and provenance               | [best/report.json](best/report.json)                         |

The original payload's SHA-256 is `123b910e19ff1ba27e4af1932b408ff0d3b1073eefcf977e8af28e40e9c2257f`. The `.txt` file preserves those exact JSON bytes. Other JSON snapshots have sorted keys and formatted whitespace; their parsed values are unchanged. [Provenance](evidence/provenance.json) records source and repository hashes, and labels the two curated extracts.

The same packing in the anchored research frame has local curved-boundary enclosing radius `2.948527063871882`. The approximately `2e-13` difference from the official score is numerical evaluation variation, not a new packing improvement. Six decimal places describe the **input coordinates and angles**, not the number of meaningful digits displayed in the radius.

The saved leaderboard observation at **2026-10-27 02:00:33 UTC** had a leader at `2.9485269238856113`, leaving a historical gap of `1.3998607206744396e-7`. These are dated values, not a current leaderboard check. The user reported a third-place submission during the conversation; the archived reports do not establish a current rank. Agents did not submit a solution. [CPU-search record](evidence/packing-cpu-search-2026-10-27.report.json)

As of the latest experiment archive, research workers were stopped. Writing this journal does not resume optimisation.

## Problem and measurement contract

The [original puzzle](https://www.paradigm.xyz/puzzles/packing/about) asks for 15 unit semicircles in the smallest enclosing circle. In the saved checker:

- `(x, y)` is the full disk centre and diameter midpoint, not the semicircle's centroid.
- `theta` is radians toward the curved half. A semicircle contains points `q` satisfying `|q - p| <= 1` and `(q - p) · (cos(theta), sin(theta)) >= 0`. Its flat diameter is perpendicular to this normal.
- The enclosing circle's centre is free; the score is its radius.
- The checker rounds all three pose fields to six decimals. It tests all 105 shape pairs using polygons with 4,096 sampled arc points, allowing intersection area up to `1e-6` per pair. Enclosure checks include true arc extrema and diameter endpoints, with `1e-9` containment tolerance.
- Our editor uses degrees for fan controls and radians for exported poses. It wraps angles before rounding to make exports stable; this is our export convention, not an additional published input restriction.

These are the saved checker semantics used by the campaign, not a fresh verification of the live service. Source fingerprints and the contract are recorded in [validator-contract.json](evidence/validator-contract.json). The application implementation is in [model.ts](../src/packing/model.ts), [overlap.ts](../src/packing/overlap.ts), and [enclosure.ts](../src/packing/enclosure.ts).

For ideal semicircles with **zero overlap**, area alone gives:

```text
15 × (π / 2) <= πR²
R >= sqrt(15 / 2) = 2.7386127875258306
```

This is a weak scale check, not an attainable target or a prediction of the optimum. The accepted polygon-and-tolerance problem differs slightly from ideal zero-overlap geometry, so that number is not an unqualified rigorous bound for every accepted payload.

### Reading the results

**Officially validated** means a saved response accepted the exported payload. **Locally valid** means our recorded checker accepted it. **Calibrated** means a method recovered a known improvement under a specific control. **Exhausted** applies only to the stated finite domains and implemented numerical constraints. **Capped** leaves the search unresolved. **Prepared** means code existed but was not dispatched. None of the latter three establishes global optimality.

Continuous coordinates and six-decimal coordinates are different evaluated arrangements. One saved continuous candidate had local radius `2.948526550730266` and zero reported unrounded overlaps. Its rounded export had radius `2.9485270732965585` and **11 overlaps**. It was not an accepted improvement. [Unrounded record](evidence/packing-unrounded.report.json)

## Chronological record

### October 25 — construction, freedom and the first strong packing

The editor began with concentric fan layers: counts, orbit radii, phases, spreads, tilts and optional shared tilt. The user's 12 + 3 arrangement reached approximately **3.028**. That early value is conversation evidence; the selected artifact history does not independently reconstruct its scene/validation pair. The broad appraisal's earliest substantiated preserved input is approximately **2.963505**.

Fan controls made construction understandable, but tied many motions together. Releasing symmetry and using individual Cartesian translations and rotations opened a larger search space. Constrained refinement, multistart exploration and replica exchange produced the officially validated **2.9485292199484325** packing. These methods included temporary worsening and larger containers to escape a local arrangement; they were not solely monotone compression.

Continuous polishing then reached a lower but unexportable point. Coordinated coordinate-frame selection and rounding produced the validated **2.9485271975184077** result instead. This established that the discrete export deserved its own search. [Early validation](evidence/packing-2948529.validation.json), [historical best record](evidence/packing-best-previous.report.json), [campaign appraisal](evidence/packing-full-adversarial-appraisal-2026-10-30.json)

### October 26 — repeated gains from rounding and lattice search

Frame enumeration, lattice descent, coupled blocks and repair improved the accepted result repeatedly:

| Stage                            |        Official radius | Evidence                                                                 |
| -------------------------------- | ---------------------: | ------------------------------------------------------------------------ |
| Free exported refinement         |     2.9485292199484325 | [validation](evidence/packing-2948529.validation.json)                   |
| Coordinated rounding             |     2.9485271975184077 | [historical report](evidence/packing-best-previous.report.json)          |
| Enumeration 2013                 |     2.9485271686200436 | [validation](evidence/packing-grid-2013.validation.json)                 |
| Lattice descent 2360             |       2.94852710129197 | [validation](evidence/packing-lattice-2360.validation.json)              |
| Lattice descent 2361             |     2.9485270999054354 | [validation](evidence/packing-lattice-2361.validation.json)              |
| Lattice block 2410               |     2.9485270908603973 | [validation](evidence/packing-lattice-block-2410.validation.json)        |
| Lattice repair 2420              |      2.948527089049121 | [validation](evidence/packing-lattice-repair-block-2420.validation.json) |
| Exact tempering 2855, October 27 | **2.9485270638716834** | [validation](evidence/packing-cpu-improvement-2855.validation.json)      |

The recorded 6.28 million rotational steps and other large proposal counts were restricted frame/cell exploration, not millions of independent packing topologies. MIP/Benders decompositions, local tangent models, barriers, recombination and native polygon/CSP kernels also ran. Some generated useful near-miss banks and implementation checks; their later batches supplied no accepted improvement. A time limit or an exception was not counted as a completed geometric rejection. [October 26 summary](evidence/packing-research-20261026-summary.json), [method coverage](evidence/packing-full-adversarial-appraisal-2026-10-30.json)

### October 27 — current best and alternative layouts

Exact tempering worker **2855** improved 2420 by `2.5177437468215658e-8` in official radius. Its phase necessarily inherited earlier tempering-bank ancestry; the exact immediate parent was not logged. Calling it an isolated “naive repair” success would erase the earlier proposal-generation work. [CPU-search record](evidence/packing-cpu-search-2026-10-27.report.json), [ancestry correction](evidence/packing-adversarial-reset-2026-10-30.json)

The frozen old/new contact comparison shows genuine coordinated movement: after removing a fitted rigid motion, midpoint RMS displacement is about **95.26 microunits**, with a maximum of **255.77 microunits**. Both have the same 30 positive-area polygon-contact pairs. A tiny score gain did not require only tiny independent coordinate changes. The new packing's recorded maximum pair area is `9.99860213525659e-7`, within the saved acceptance threshold. [Contact audit](evidence/packing-best2855-contact-summary.extract.json)

The user's gap and striping hypotheses led to real alternative constructions:

| Family                                    | Saved official radius | Outcome                                           |
| ----------------------------------------- | --------------------: | ------------------------------------------------- |
| Mirrored stripes, then released symmetry  |      2.96756022380705 | Valid; worse than the incumbent                   |
| Strict bilateral construction             |    2.9923695162469226 | Valid; worse                                      |
| Interior gaps limited to triangles/arrows |    3.0068710549490167 | Valid; worse, with an exterior five-corner pocket |
| Later coupled/striped refinement          |    2.9755238091962317 | Improved that alternative, not the incumbent      |

Mirrored, asymmetric-middle, coupled and stripe studies tried separating and rotating central pieces, contact directions, continued constrained refinement and seam-aware local solves. Closing one gap could displace another contact or move the complicated pocket elsewhere. Four-corner gaps could still have substantial area. These finite studies do not prove that symmetry or triangle/arrow constructions cannot win. [Seed study](evidence/packing-seed-study-2026-10-27.report.json), [asymmetric-middle study](evidence/packing-asymmetric-study-2026-10-27.report.json), [striped refinement](evidence/packing-striped-push-2026-10-27.report.json)

There is no independently reconstructed October 28–29 entry in the selected evidence. The next consolidated experimental records are dated October 30.

### October 30 — adversarial review and controlled follow-ups

Reviewers examined the whole campaign, including the main incumbent, rather than only the striped alternatives. The main concern was **proposal and repair coverage**: a precise final checker does not make a narrow or poorly ranked proposal set useful.

Earlier pinned CVP searches scored **312,699 retained proposals**, including many with attractive radii, but generated no new feasible proposal. First-phase batches changed only one interior angle in approximately 94% of retained candidates. Completed K-best enumeration did not mean exhaustion of a physical neighbourhood. Several historical reduced boxes and retained tangent cuts also had demonstrated coverage defects. [Full appraisal](evidence/packing-full-adversarial-appraisal-2026-10-30.json)

The follow-up program made the limits more concrete:

| Experiment                                         | Recorded outcome                                                              | What it establishes                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Paired tempering replay                            | Both arms completed 80,000 exact evaluations; no improvement                  | A budget-normalized comparison, not an exact historical replay or sufficient recovery control |
| Initial small-step CSP                             | Widths ±2/±4 exhausted; ±7 capped                                             | Restricted negatives and an unresolved larger box                                             |
| Matched and widened 42D versus conditional-41D CVP | 3,612 + 3,584 points scored; no strict native/reference validity disagreement | Agreement of acceptance checks on those points, not adequate proposal coverage                |
| Fixed-witness audit                                | All 3,584 widened proposals retained three boundary witnesses                 | That particular proposal family could not meet its radius target                              |

Neither 80,000-evaluation replay arm selected bank21, the source from which the later fixed-source CSP recovered the known improvement. Adaptive choices and random-number consumption differed, so equal evaluation counts did not isolate source or target effects. The omission was a demonstrated coverage gap, not proof that it was the sole cause of failure.

The retained points were on pieces **2, 11 and 14**. Their own enclosing circle had radius `2.948527063871881`, above the requested `2.948527062871882`. Moving only piece 12's Y coordinate by ±1 microunit did not remove that obstruction. “At least one midpoint changed” was therefore an inadequate exploration criterion. The proof concerns that recorded family, not every nearby packing. [Controlled-program extract](evidence/packing-controlled-summary-2959.extract.json), [fixed-witness proof and withdrawn claims](evidence/packing-adversarial-reset-2026-10-30.json)

### October 30 — known-recovery calibration and finite-domain continuation

A source-only ±5-grid box around frozen bank21 contained a withheld known improvement over 2420. The native CSP found a valid repair in **49.68 seconds / 4,731 nodes**, without using the withheld answer as a search hint. Its local radius matched the known best; two interior angle values need not match the withheld witness. This calibrated recovery on that instance, not a new score or a universal guarantee. [Calibration report](evidence/packing-known-recovery-2961-calibration.report.json)

The longer current-incumbent continuation then **exhausted the implemented width-5 domains** at target `2.948527062871882` in **71.33 native seconds / 12,371 nodes**, with no target-meeting solution. Its short earlier run had capped. The negative applies to those finite domains, constraints and floating-point calculations; it does not certify a whole basin or exclude smaller gains. A new projection-based repair failed its own recovery control, so its main campaign was blocked. [Calibrated-program report](evidence/packing-calibrated-program-2969-report.json)

Next, an audit of 248 existing vectors selected eight distinct near-valid bodies across recorded lineages and grid phases. **All eight 60-second repair runs capped** without an accepted candidate. No selected box was excluded. Native counters were unavailable, so recorded zero aggregates must not be interpreted as zero search work. A controller exit-race error was retained in the record; a separate process inspection reconciled shutdown and all eight terminal worker results. [Eight-seed sweep](evidence/packing-seed-sweep-2972-summary.json)

The earlier appraisal's “prepared/not run” conditional-41D, continuation and recovery recommendations are historical snapshots. The entries above supersede those statuses.

### October 30 — caching and performance

Three variants were tested: an exact-angle cache, followed by two conservative normal-block variants. Each passed **8,558 fixtures / 16,453 comparisons** against the pinned historical native library, with zero measured bit mismatches or acceptance-threshold flips. Each reproduced the original recovery's **4,731 nodes, nine counters and all 45 returned pose values**. This is equivalence on the declared tests, not a universal proof of equivalence to Shapely or the live server.

| Variant                  | Hot geometry CPU, new / old | Native solver wall time |
| ------------------------ | --------------------------: | ----------------------: |
| Angle cache 2975         |                      1.0161 |                 49.28 s |
| Normal-block cache 2981  |                      0.9995 |                 50.30 s |
| Cheaper block guard 2983 |                      0.9808 |                 50.20 s |

The original native solver run was 49.37 seconds. Native solver wall times came from different host conditions and are not a causal speed comparison. Including the wrappers, the three recovery runs took 50.15, 51.68 and 51.03 seconds. The angle cache had 165 misses and no evictions during recovery; block skipping removed about 85% of normal checks. Those counts did not translate into a useful demonstrated whole-search gain. **The proposed cached rerun of the eight seeds was not started.**

Instrumented V2 fixtures attributed 94.7% of time to a combined stage containing normal/block tests, clipping and bounds. The corpus mixed near-contact, stress and cache-churn inputs, and included timing overhead. It was not a representative production CSP trace and does not identify clipping alone as the next bottleneck. [Final cache assessment](evidence/packing-cache-final-2985.json), [diagnostic](evidence/packing-phase-profile-2982-result.json)

## Method inventory: what helped and what did not

This table groups related work; file, worker and trial counts are not counts of independent methods. Exact invocation details remain in the archived reports.

| Method family                                                     | Contribution or outcome                                                 | Limit of the evidence                                                                      |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Fan tightening and restarts                                       | Useful construction and early radius reduction                          | Equal spacing/shared tilt restrict motion; count reduction can redistribute every piece    |
| Cartesian constrained refinement                                  | Freed individual poses and supplied strong continuous packings          | A continuous local optimum can round to invalid poses                                      |
| Annealing, replica exchange, minima hopping, collective breathing | Actual larger-radius moves and basin escapes occurred                   | Many starts and archives shared ancestry                                                   |
| Random, paired-circle, boundary/core/wall/wedge starts            | Several different construction families genuinely ran                   | Finite stochastic coverage; some logs end before completion                                |
| Cavity removal/reinsertion and vacancy moves                      | Valid topology-changing completions were generated                      | Beam selection and inherited seeds restricted coverage                                     |
| Symmetry, genetic crossing and archived-parent mating             | Tested C3/C5, dihedral, mirror and released-symmetry families           | No proof that retained contact hashes represent independent basins                         |
| Frames, coordinated rounding, lattice blocks and repair           | Repeated official score improvements; essential to the milestone ladder | Fixed frames or reduced bases can omit useful physical moves                               |
| Exact tempering and local walks                                   | Worker 2855 delivered the current best                                  | Precise winning parent missing; no implication that all later walks were equally effective |
| MIP/Benders, Schur, barriers and tangent models                   | Useful decompositions, near misses and debugging                        | Capped solves, stale cuts and local linear models cannot prove infeasibility               |
| Native CSP and compatibility propagation                          | Known-recovery success and an exhausted finite width-5 box              | Numerical/finite-domain result; capped seed runs remain open                               |
| CVP and ranked lattice proposals                                  | Exposed severe diversity and objective-coverage problems                | Attractive surrogate cost and a filled K-best list are insufficient                        |
| Contact/seam/curvature analysis                                   | Improved derivative checks and explained restricted motion              | No nonlinear local-optimality certificate or successful escape from the main best          |
| Mirrored stripes, middle asymmetry and gap simplification         | Valid alternatives and local improvements within them                   | None beat the main best; corner count did not predict density                              |
| Exact geometry caches                                             | Tested transparency and cache behaviour                                 | No useful whole-search speedup established                                                 |

[Full family coverage and historical limitations](evidence/packing-full-adversarial-appraisal-2026-10-30.json)

## Findings and corrected interpretations

1. **A smaller semicircle count need not improve a constrained fan.** Changing N redistributes its angles, so 12 + 4 and 11 + 4 are not nested feasible sets. Deleting one piece while preserving every remaining pose does give a subset, but that is a different operation. The editor retained both behaviours.
2. **More decimal precision was not shown to destroy the successful score.** Frozen 42-trial replays recovered 2420 using both gradient providers; the newer one was about 1.683 times slower. An apparent reproduction failure came from a repair pool changing from 58 to 173 members. This does not rule out other heuristic regressions. [Precision replay](evidence/packing-precision-replay-review.json)
3. **Nearly parallel flat edges require care, but the audit found no first-order seam error explaining the plateau.** An earlier h-versus-h/2 comparison reused the same fallback on both sides. Independent polygon comparisons improved that check. Coarse curvature steps crossed contact branches; very small second differences amplified cancellation. Positive curvature in four tested modes was not a full optimality proof. [Seam audit](evidence/packing-seam-audit-summary.json)
4. **Gap shape is a hypothesis generator.** Removing interior zigzags did not improve the best radius. A triangle/arrow count ignores gap area, outer pockets and the constraints elsewhere in the packing. No inherent symmetry theorem has been established for this instance.
5. **Acceptance and search guidance are separate.** An older invalid-state radius surrogate overestimated by up to `5.94e-7`, larger than the historical remaining gap. Saved promotions still used independent checks, and later workers used full curved MEC for proposals too. Correct final acceptance does not repair poor guidance or source selection. [CPU-search findings](evidence/packing-cpu-search-2026-10-27.report.json)
6. **A tiny objective gap can require substantial coordinated displacement.** The frozen 2420→2855 movement audit and retained-witness proof explain why interior-only nudges can stall. Conversely, a lower retained-witness bound only makes a proposal potentially useful; it does not establish feasibility or a better radius.
7. **Signed clearance and overlap area are different constraints.** Requiring nonnegative signed gap excludes some tolerance-accepted poses. Likewise, linearized contact directions, Jacobian rank and one-coordinate budgets do not certify nonlinear feasibility. The contact-ray work near radius 2.976 concerned the alternate striped family, not a rigidity proof at the main 2.948527 candidate.
8. **The coordinate frame matters after rounding.** Integer-grid translations preserve an exported arrangement. Arbitrary rotations or fractional translations followed by rounding can alter it. Fixing the first angle is a real discrete restriction. A one-microunit physical move needed a reduced-basis coefficient as large as 51 in one audit; a small coefficient box was not necessarily a small complete physical neighbourhood.

The [adversarial reset](evidence/packing-adversarial-reset-2026-10-30.json) explicitly withdrew claims that any midpoint change, a full candidate budget, tiny strict floating-point worsening, or equal evaluation counts alone demonstrates useful exploration. It also corrected the idea that the simpler final repair received no benefit from earlier sophisticated work.

## Remaining avenues, in order of evidential value

These are proposed experiments, not claims that a better packing exists in the stated region. No programme below is running.

1. **Resolve one promising unfinished seed box.** Near-lattice2400 has local radius `2.948527052581241`, already below the target, but remains invalid with maximum area `1.0000515925020774e-6`: about `5.16e-11` over tolerance. It and bank21 are concrete repair candidates, not accepted improvements. Use the calibrated kernel, durable timeout telemetry and a declared finite budget. Small overlap excess is a selection heuristic, not a recovery guarantee. [Seed diagnostics](evidence/packing-seed-sweep-2972-summary.json)
2. **Separate target difficulty from neighbourhood size.** Current-body ±5 at best-minus-`1e-9` is already a completed negative. A smaller reduction, such as `0.5e-9`, in that box remains a separate question; ±7 at minus-`1e-9` capped at 300 seconds. Change one factor at a time, keep all first-angle offsets and report completion, cap and failure separately. Do not repeat the completed ±5/minus-`1e-9` case unchanged.
3. **Require power controls before another proposal or repair method.** The projection prototype failed its own calibration. A CSP recovery does not calibrate a different generator. With the same intended generator and repair kernel, first recover the withheld improvement, then measure strict feasible fraction, distinct relative geometry, persistent invalid pairs and gain per reference evaluation. Require target-qualified exported radius and removal of any blocking retained-witness bound. An already radius-qualified near miss may legitimately improve through interior-only overlap repair. Record the exact parent and source-bank hash.
4. **Test coordinated boundary motion from the incumbent.** Use retained arc/end-point witnesses as a necessary obstruction test, then allow coupled centre, angle and contact changes outside the exhausted box. The old/new displacement audit gives a scale to test, not a guaranteed descent direction. Every retained candidate still needs all pair checks and a curved-boundary enclosure calculation.
5. **Choose further kernel work from representative whole-search profiles.** Measure an actual CSP run's CPU cost, including setup, propagation, pair checks and clipping. Keep the original floating-point flags and compare identical search work. The tested caches do not justify a speedup claim or selecting clipping alone as the next target.
6. **Explore substantially different contact arrangements as a separate campaign.** Mirrored stripes and triangle/arrow seeds were useful tests but did not win. New constructions should supply genuinely different initial geometry and track lineage/contact diversity. Releasing a visual symmetry may help, but neither visual harmony nor lack of zigzags is an optimisation criterion supported by the results.

No complete local or global certificate exists. Small enough gains inside an exhausted target box, larger physical motions, different coordinate phases, and other contact arrangements have not all been excluded. Repeating previous finite failures does not close those questions.

## Operational record and continuation rules

- **Submission stays manual.** Validation-only calls and leaderboard submissions are distinct; the agent has no standing authorisation to submit a solution.
- **Preserve the best.** A new proposal must retain its exact payload, reference checks and saved validation response before replacing a best-result snapshot. Keep the previous snapshot and update this journal's milestone table.
- **Freeze experiments.** Record source hashes, selected parent, pose domain, first-angle policy, random seed, target, compiler/runtime flags, evaluation budget, wall limit and actual termination reason. A historical checkpoint is not a clean matched control if its input bank or trial horizon has changed.
- **Use strict promotion checks.** Internal compatibility slack or surrogate acceptance is not enough. The saved six-decimal export, all 105 pair checks, curved-boundary enclosure and scene roundtrip must agree; an official validation response is recorded separately.
- **Respect resource limits.** The requested host CPU ceiling is 90%, with operation budgets up to 600 seconds. Recent work used at most one owned process group at a time, with reactive pauses above 50% and resumes below 35%. The cache programme still recorded **15 active-job host samples above 90%, maximum 100%**, with attribution unresolved. A continuous host ceiling was not established; it must not be reported as achieved.
- **Verify shutdown.** The final cache archive records 11 successful sequential jobs, a sealed zero-worker controller and a fresh outside-sandbox process inspection. Its preceding controller fix passed five lifecycle probes. Preserve capped/error records alongside any cleanup reconciliation.
- **Keep services user-managed.** Reuse the existing app service and do not start a replacement for a research run. Browser snapshots are local editor state, not a substitute for a portable experiment record.

## Evidence and maintenance

The versioned [provenance manifest](evidence/provenance.json) indexes the selected snapshots. Historical absolute paths, status strings and recommendations inside them are preserved as evidence; they are not repository dependencies and can be superseded by later entries here. The original coordinate payload is retained byte-for-byte. This journal is the current interpretation, while the snapshots preserve what was recorded at the time.

The full local archive remains under the manifest's `localOriginalRoot`. It includes `paused-research/`, `resumed-research/`, and the dated `controlled-experiments-2026-10-30/`, `calibrated-search-2026-10-30/`, `seed-repair-sweep-2026-10-30/` and `cache-performance-2026-10-30/` bundles. Those contain the large source closures, checkpoints, fixture corpora and raw ledgers omitted from Git. The cache bundle contains 289 files and was verified against 291 hash records. Reproducing a historical native experiment may require that full archive; the selected snapshots here are not a standalone native research runtime.

For future entries, append the UTC date, question, source/parent, method and budget, result, validation level, exact termination status, evidence links, and changed interpretation. Mark superseded conclusions explicitly. Update the best snapshot only after recording its provenance and preserve all prior milestones. Keep proposed work separate from executed work.
