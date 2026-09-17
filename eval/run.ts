/**
 * Router accuracy evaluation against the live Jev API. See docs/EVAL.md.
 *
 * Exit code is non-zero only when a gated case fails or the API fails. Aggregate accuracy is
 * reported, not gated: with a few dozen cases one miss moves it by several points.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { createJev } from "../src/jev.js";
import { buildRouting, buildRubricPick, key, readRouting, readRubricPick } from "../src/router.js";
import type { Kind, QuestionInput } from "../src/schema.js";

interface Expectation {
  kind: Kind;
  rubric?: string;
}
interface Case extends QuestionInput {
  id: string;
  branch: string;
  gate?: boolean;
  expect: Expectation;
  accept?: Expectation[];
}
interface Prediction {
  id: string;
  branch: string;
  gate: boolean;
  expect: Expectation;
  got: { kind: Kind; kindConfidence: number; rubric?: string; rubricConfidence?: number };
  kindOk: boolean;
  rubricOk: boolean | null;
  ok: boolean;
}

if (!process.env.TYPESAFE_API_KEY) {
  console.error("eval: TYPESAFE_API_KEY is not set, skipping");
  process.exit(0);
}

const require = createRequire(import.meta.url);
const sdkVersion = (require("@typesafe-ai/sdk/package.json") as { version: string }).version;
const dataset = JSON.parse(readFileSync(join(import.meta.dirname, "cases.json"), "utf8")) as {
  version: number;
  cases: Case[];
};
const jev = createJev();
const BATCH = 10;
let model = "";

function chunks<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

// Step 1: routing, in production-sized batches.
const routed = new Map<string, { kind: Kind; confidence: number }>();
for (const batch of chunks(dataset.cases, BATCH)) {
  const result = await jev.systemOne(buildRouting(batch));
  model = result.model;
  batch.forEach((c, i) => {
    const a = result.answers[key(i)];
    if (a?.type !== "choice") throw new Error(`eval: missing routing answer for ${c.id}`);
    routed.set(c.id, readRouting(a));
  });
}

// Step 2: rubric pick, in isolation: forced for every case whose EXPECTED kind is a scale
// without options, so a routing miss cannot hide a rubric miss.
const picked = new Map<string, { name: string; confidence: number }>();
const scaleCases = dataset.cases.filter((c) => !c.options && c.expect.kind === "score");
for (const batch of chunks(scaleCases, BATCH)) {
  const result = await jev.systemOne(
    buildRubricPick(
      batch,
      batch.map((_, i) => i),
    ),
  );
  batch.forEach((c, i) => {
    const a = result.answers[key(i)];
    if (a?.type !== "choice") throw new Error(`eval: missing rubric answer for ${c.id}`);
    picked.set(c.id, readRubricPick(a));
  });
}

// Score.
const predictions: Prediction[] = dataset.cases.map((c) => {
  const r = routed.get(c.id);
  if (!r) throw new Error(`eval: no routing for ${c.id}`);
  const p = picked.get(c.id);
  const accept = c.accept ?? [c.expect];
  const kindOk = accept.some((e) => e.kind === r.kind);
  const rubricOk = p ? accept.some((e) => e.rubric === undefined || e.rubric === p.name) : null;
  const got = p
    ? { kind: r.kind, kindConfidence: r.confidence, rubric: p.name, rubricConfidence: p.confidence }
    : { kind: r.kind, kindConfidence: r.confidence };
  return {
    id: c.id,
    branch: c.branch,
    gate: c.gate ?? false,
    expect: c.expect,
    got,
    kindOk,
    rubricOk,
    ok: kindOk && rubricOk !== false,
  };
});

const pct = (n: number, d: number) =>
  d === 0 ? "n/a" : `${((100 * n) / d).toFixed(0)}% (${n}/${d})`;
const branches = [...new Set(predictions.map((p) => p.branch))];
const summary = {
  datasetVersion: dataset.version,
  sdkVersion,
  requestedModel: process.env.TYPESAFE_DEFAULT_MODEL ?? "jev-latest",
  resolvedModel: model,
  ranAt: new Date().toISOString(),
  routingAccuracy: pct(predictions.filter((p) => p.kindOk).length, predictions.length),
  rubricAccuracy: pct(
    predictions.filter((p) => p.rubricOk === true).length,
    predictions.filter((p) => p.rubricOk !== null).length,
  ),
  perBranch: Object.fromEntries(
    branches.map((b) => {
      const ps = predictions.filter((p) => p.branch === b);
      return [b, pct(ps.filter((p) => p.ok).length, ps.length)];
    }),
  ),
  gateFailures: predictions.filter((p) => p.gate && !p.ok).map((p) => p.id),
  misses: predictions.filter((p) => !p.ok).map((p) => ({ id: p.id, expect: p.expect, got: p.got })),
};

const reportDir = join(import.meta.dirname, "report");
mkdirSync(reportDir, { recursive: true });
const file = join(reportDir, `${summary.ranAt.replace(/[:.]/g, "-")}.json`);
writeFileSync(file, JSON.stringify({ summary, predictions }, null, 2));

console.error(
  `eval: model ${summary.resolvedModel}, sdk ${sdkVersion}, dataset v${dataset.version}`,
);
console.error(`eval: routing ${summary.routingAccuracy}, rubric ${summary.rubricAccuracy}`);
for (const [b, v] of Object.entries(summary.perBranch))
  console.error(`eval:   ${b.padEnd(15)} ${v}`);
for (const m of summary.misses)
  console.error(
    `eval: miss ${m.id}: expected ${JSON.stringify(m.expect)}, got ${JSON.stringify(m.got)}`,
  );
console.error(`eval: report ${file}`);
if (summary.gateFailures.length > 0) {
  console.error(`eval: GATE FAILURES ${summary.gateFailures.join(", ")}`);
  process.exit(1);
}
