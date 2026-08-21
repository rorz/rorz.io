import process from "node:process";
import { spawn } from "bun";

interface BiomeSummary {
  readonly errors: number;
  readonly infos: number;
  readonly warnings: number;
}

interface BiomeReport {
  readonly summary: BiomeSummary;
}

const baseArguments = [
  "check",
  "--diagnostic-level=info",
  "--max-diagnostics=none",
  ".",
] as const;

const inspection = spawn(
  [
    "biome",
    ...baseArguments,
    "--reporter=json",
  ],
  {
    stderr: "pipe",
    stdout: "pipe",
  },
);
const inspectionOutput = await new Response(inspection.stdout).text();
const inspectionError = await new Response(inspection.stderr).text();
const inspectionExitCode = await inspection.exited;
const reportLine = inspectionOutput.trim().split("\n").at(-1);

if (!reportLine) {
  throw new Error(`Biome returned no report. ${inspectionError}`);
}

const report = JSON.parse(reportLine) as BiomeReport;
const diagnosticCount = report.summary.errors + report.summary.warnings + report.summary.infos;

if (inspectionExitCode !== 0 || diagnosticCount > 0) {
  const display = spawn(
    [
      "biome",
      ...baseArguments,
    ],
    {
      stderr: "inherit",
      stdout: "inherit",
    },
  );

  await display.exited;
  process.exit(1);
}
