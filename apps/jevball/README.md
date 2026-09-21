# Magic-Jev-Ball

A React + Vite app with a Cloudflare Worker backend and the 20 classic Magic 8 Ball answers. The user supplies one question. Three.js can later use the stable `faceIndex` returned by the API.

## Run

From the repository root:

```sh
bun install
cp apps/jevball/.dev.vars.example apps/jevball/.dev.vars
# Add TYPESAFE_API_KEY to .dev.vars.
bun run dev:jevball
```

Open <http://127.0.0.1:4446>. Reuse an existing server on that port. The API key stays in the Worker.

```sh
bun run build:jevball
bun run deploy:jevball:dry
bun run verify
```

Deployment uses `jevball.rorz.io`. Set the secret with `bun --cwd apps/jevball wrangler secret put TYPESAFE_API_KEY` before deploying. Run `bun run --filter @rorz/jevball cf:types` after editing Wrangler bindings.

## How Jev is used

The Worker uses the official `@typesafe-ai/sdk`: [jev.ts](src/worker/jev.ts) creates a `TypeSafeClient` and calls `client.systemOne()`. The browser calls our `/api/ask` endpoint.

[question-set.ts](src/worker/question-set.ts) contains the SDK's `choice()` definitions, structured context, phrase rubrics, and tuning constants. The only user data sent as `state` is `{ question }`. Context comes from the app's question instructions and option descriptions. Questions are independent; none can read another's answer.

Three Choices run in parallel in one SDK request:

| Question | Type | Purpose |
| --- | --- | --- |
| `evidence` | 20-option Choice | Which classic answer best reflects the available evidence? |
| `playful` | 20-option Choice | Which classic answer makes the most fitting playful reply? |
| `intent` | 4-option Choice | Is the question factual, playful, consequential, or unclear? |

“Should I get a new job?” invites a playful nudge. That differs from quitting immediately with no savings. Ordinary speculative questions can be playful; established facts and strong base rates take precedence. Each phrase has distinct rubrics for evidence and play: “As I see it, yes” fits subjective encouragement, while “It is certain” fits established facts.

## Tune the ball

Edit `selectionPolicy` and the structured rubrics in [question-set.ts](src/worker/question-set.ts).

| Setting | Default | Effect |
| --- | --- | --- |
| `playfulness` | `0.95` | Share of the playful distribution for eligible questions; 0–1. Zero uses the evidence answer. |
| `temperature` | `1.25` | Broadens playful weights above 1, sharpens below 1. Must be positive. |
| `optimism` | `1` | Multiplier for playful yes weights. One is neutral; must be positive. |
| `minimumPlayfulProbability` | `0.5` | Required intent probability; playful must also be the winning intent. |
| `maximumConsequentialProbability` | `0.1` | Maximum probability of a consequential request for playful sampling. |
| `evidenceOverrideProbability` | `0.9` | Combined evidence weight on yes or no that overrides playfulness. |

For eligible questions, each playful probability is raised to `1 / temperature`, tilted by `optimism` for yes answers, and normalized. The final distribution mixes that with the evidence distribution using `playfulness`. The app samples a fresh answer from the final weights. There is no uniform fallback or equal allocation within groups. A zero in both Jev distributions stays zero.

Evidence mode uses Jev's evidence Choice directly. The override adds up probabilities across synonymous yes/no phrases; low confidence about wording alone does not imply uncertainty about the underlying fact.

The table shows the other 19 answers in descending order. Playful percentages are actual sampling chances. Evidence percentages are normalized Jev answer weights. Neither measures the probability that a future event happens. API diagnostics retain both raw distributions, routing probabilities, the applied policy, and the effective mix. The `Server-Timing` response header records the Jev call duration, including network time and any SDK retry.

## API

| Endpoint | Result |
| --- | --- |
| `GET /api/answers` | Canonical answer catalogue and stable face indices. |
| `GET /api/question-set` | SDK question definitions, current policy, version, and model. |
| `POST /api/ask` | `answer`, `mode`, 20-option `distribution`, and `diagnostics`. |

```json
{ "question": "Should I get a new job?" }
```

Questions are limited to 1000 characters. User-supplied policy or context fields are rejected. Provider failures return an error rather than a made-up fortune. The Worker has request limits, bounded SDK retries/timeouts, and no response caching.

## Jev references

- [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)
- [Structured instructions and criteria](https://docs.typesafe.ai/primitives/advanced)
- [Choice distributions](https://docs.typesafe.ai/primitives/choice)
- [Batching independent questions](https://docs.typesafe.ai/patterns/fan-out)
- [Confidence](https://docs.typesafe.ai/confidence)
