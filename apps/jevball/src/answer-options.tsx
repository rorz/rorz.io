import { faceLayout } from "./face-label.ts";
import type { AskResult } from "./protocol.ts";

const percentage = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 1,
  style: "percent",
});

const DieFace = ({ text }: { readonly text: string }) => {
  const layout = faceLayout(text);
  return (
    <svg
      aria-hidden="true"
      className="h-9 w-10 shrink-0 xl:h-7 xl:w-8"
      preserveAspectRatio="none"
      viewBox="0 0 512 512"
    >
      <path
        className="fill-blue-600/60 stroke-violet-300/30"
        d="M0 0H512L256 512Z"
        strokeLinejoin="round"
      />
      <text
        className="fill-violet-100 font-mono"
        dominantBaseline="middle"
        fontSize={layout.fontSize}
        fontWeight="600"
        textAnchor="middle"
      >
        {layout.lines.map((line) => (
          <tspan key={line.text} x="256" y={line.y}>
            {line.text}
          </tspan>
        ))}
      </text>
    </svg>
  );
};

const AnswerOptions = ({ result }: { readonly result: AskResult }) => {
  const alternatives = result.distribution
    .filter((option) => option.id !== result.answer.id)
    .toSorted((left, right) => right.probability - left.probability);

  return (
    <div className="xl:max-h-96 xl:mask-b-from-90% xl:overflow-y-auto xl:overscroll-contain xl:pr-3 xl:pb-10">
      <table className="w-full text-left text-xs text-zinc-300">
        <caption className="pb-3 text-left text-xs text-zinc-400">
          <span className="block text-zinc-300">Other possibilities (from Jev)</span>
          <span className="mt-1 block">Chance of being drawn</span>
        </caption>
        <thead className="border-b border-zinc-800 text-xs text-zinc-500">
          <tr>
            <th className="pb-2 font-normal" scope="col">
              Answer
            </th>
            <th className="pb-2 text-right font-normal" scope="col">
              Chance
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {alternatives.map((option) => (
            <tr key={option.id}>
              <td className="py-1 pr-3">
                <span className="flex items-center gap-3 xl:gap-2">
                  <DieFace text={option.text} />
                  {option.text}
                </span>
              </td>
              <td className="py-2 text-right font-mono text-xs whitespace-nowrap text-zinc-400 tabular-nums">
                {percentage.format(option.probability)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { AnswerOptions };
