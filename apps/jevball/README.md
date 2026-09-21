# Magic-Jev-Ball

A React + Vite app with a Cloudflare Worker backend and the 20 classic Magic 8 Ball answers. The user supplies one question, and a Three.js ball turns upward to reveal the answer on its floating die.

## The ball

React Three Fiber renders the ball, with Drei's procedural studio lighting. The shell flips upward through 180 degrees with a sharp initial impulse and a long ease out. The separate twenty-sided die follows a slightly different spiral and twisting rise each time, finishing alongside the shell when the response arrives promptly. Its downward-pointing face sits against a curved, refractive window, with light absorbed through the liquid and slight movement against the glass. Each inscription's line breaks and font size are fitted to the triangle. The API's stable `faceIndex` selects the physical face. A closed black interior keeps the window opaque from every angle. Mouse parallax moves the ball and surfaced die together, with a small amount of slip.

The [React Bits Balatro shader](https://reactbits.dev/backgrounds/balatro) is adapted into the same canvas. It swirls before and during the turn, with smoothly eased hue shifts and a restrained ball wobble as you type. The ball's coloured reflections share the shader's hue and fade. The answer reveal fades the background almost to black, leaving a faint spotlight. Its licence is retained in [REACT-BITS-LICENSE.md](REACT-BITS-LICENSE.md). The scene uses the existing Tailwind colour palette, a capped pixel ratio, and reduced-motion support. The accessible form and answer also work if WebGL is unavailable.

The large answer uses the locally bundled, open-licensed [Lacquer](https://fonts.google.com/specimen/Lacquer) typeface. It approximates the distressed lettering of the reference; the original [FF Confidential](https://www.myfonts.com/collections/ff-confidential-font-fontfont) requires its own webfont licence. The alternatives table includes miniature inscriptions and the actual selection chances.

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

[question-set.ts](src/worker/question-set.ts) defines one `choice()` with all 20 classic phrases as its options. Its structured instructions give Jev the Magic 8 Ball context: personality, playfulness, evidence, and uncertainty. The only user data sent as `state` is `{ question }`.

Jev returns one distribution over the twenty answers. The Worker normalizes the rounded probabilities and samples a fresh answer directly from those weights. There are no intermediate categories, per-answer Nouls, blended distributions, or uniform fallback weights. A zero weight stays zero.

## Tune the ball

Edit the instructions in [question-set.ts](src/worker/question-set.ts). The `playfulness` text makes ordinary speculation such as “Should I get a new job?” an invitation to play, even with missing personal details. `evidence` keeps established facts and explicitly consequential decisions grounded. These are ordinary JSON labels understood by Jev, not special SDK settings.

All behavior comes from that one question and the returned distribution. Sampling supplies the randomness; changing the context changes which replies Jev favors. There is no separate routing guarantee or confidence threshold, and low confidence between similar phrases does not force an uncertain answer.

The table shows the other 19 answers in descending order. Percentages are actual selection chances across all twenty options, not the probability that a future event happens. API diagnostics retain the raw Jev result and question-set version. The `Server-Timing` response header records the Jev call duration, including network time and any SDK retry.

## API

| Endpoint | Result |
| --- | --- |
| `GET /api/answers` | Canonical answer catalogue and stable face indices. |
| `GET /api/question-set` | The SDK question definition, version, and model. |
| `POST /api/ask` | `answer`, 20-option `distribution`, and `diagnostics`. |

```json
{ "question": "Should I get a new job?" }
```

Questions are limited to 1000 characters. User-supplied policy or context fields are rejected. Provider failures return an error rather than a made-up fortune. The Worker has request limits, bounded SDK retries/timeouts, and no response caching.

## Jev references

- [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)
- [Structured instructions and criteria](https://docs.typesafe.ai/primitives/advanced)
- [Choice distributions](https://docs.typesafe.ai/primitives/choice)
- [Confidence](https://docs.typesafe.ai/confidence)
