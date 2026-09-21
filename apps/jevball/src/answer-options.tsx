import type { AskResult } from "./protocol.ts";

const percentage = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 1,
  style: "percent",
});

const AnswerOptions = ({ result }: { readonly result: AskResult }) => {
  const alternatives = result.distribution
    .filter((option) => option.id !== result.answer.id)
    .toSorted((left, right) => right.probability - left.probability);

  return (
    <table className="w-full text-left text-sm text-zinc-400">
      <caption className="pb-3 text-left text-xs text-zinc-500">
        Other answers · share of all 20 possibilities
      </caption>
      <thead className="border-b border-zinc-800 text-xs text-zinc-500">
        <tr>
          <th className="pb-2 font-normal" scope="col">
            Answer
          </th>
          <th className="pb-2 text-right font-normal" scope="col">
            {result.mode === "playful" ? "Selection chance" : "Answer weight"}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800/60">
        {alternatives.map((option) => (
          <tr key={option.id}>
            <td className="py-2 pr-4">{option.text}</td>
            <td className="py-2 text-right font-mono text-xs text-zinc-500 tabular-nums">
              {percentage.format(option.probability)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export { AnswerOptions };
