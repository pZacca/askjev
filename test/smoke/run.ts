/**
 * Installed-tarball smoke test.
 *
 * 1. `npm pack` the project.
 * 2. Install the tarball into a fresh temp directory, as a user would.
 * 3. Spawn the installed entrypoint over stdio with a stubbed upstream.
 * 4. Complete the MCP handshake, list tools, call `ask`, and check the result shape.
 *
 * Only spawning the installed package catches a broken `bin`, a missing file in `files`,
 * a dependency left out of `dependencies`, or a stray write to stdout.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { startStub } from "./stub-upstream.js";

const root = process.cwd();
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (args: string[], cwd: string) =>
  execFileSync(npm, args, {
    cwd,
    stdio: ["ignore", "pipe", "inherit"],
    shell: process.platform === "win32",
  }).toString();

function fail(msg: string): never {
  console.error(`smoke: FAIL ${msg}`);
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), "askjev-smoke-"));
let stub: Awaited<ReturnType<typeof startStub>> | undefined;
let transport: StdioClientTransport | undefined;
try {
  console.error("smoke: packing");
  run(["pack", "--pack-destination", work], root);
  const tarball = readdirSync(work).find((f) => f.endsWith(".tgz")) ?? fail("no tarball produced");

  console.error("smoke: installing into a temp dir");
  const install = join(work, "consumer");
  mkdirSync(install, { recursive: true });
  run(["init", "-y"], install);
  run(["install", "--no-audit", "--no-fund", join(work, tarball)], install);

  const shim = join(
    install,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "askjev.cmd" : "askjev",
  );
  if (!existsSync(shim)) fail(`bin shim not created at ${shim}`);
  const entry = join(install, "node_modules", "askjev", "dist", "cli.js");
  if (!existsSync(entry)) fail(`entrypoint missing at ${entry}`);

  stub = await startStub();
  console.error(`smoke: stub upstream at ${stub.url}`);

  transport = new StdioClientTransport({
    command: process.execPath,
    args: [entry],
    env: { ...process.env, TYPESAFE_API_KEY: "smoke-key", TYPESAFE_BASE_URL: stub.url },
    stderr: "pipe",
  });
  transport.stderr?.on("data", (d) => process.stderr.write(`  [server] ${d}`));

  const client = new Client({ name: "smoke", version: "0" });
  const timer = setTimeout(() => fail("timed out"), 30_000);
  await client.connect(transport);
  console.error("smoke: handshake ok");

  const { tools } = await client.listTools();
  if (tools.length !== 1 || tools[0]?.name !== "ask")
    fail(`unexpected tools: ${tools.map((t) => t.name)}`);

  const result = await client.callTool({
    name: "ask",
    arguments: {
      state: "smoke",
      questions: [
        { question: "Is it on?" },
        { question: "Which?", options: ["a", "b"] },
        { question: "How much?", options: ["low", "high"] },
      ],
    },
  });
  if (result.isError) fail(`tool error: ${JSON.stringify(result.content)}`);
  const out = result.structuredContent as { model: string; answers: { kind: string }[] };
  if (out.answers.length !== 3) fail(`expected 3 answers, got ${JSON.stringify(out)}`);
  for (const a of out.answers) {
    if (!["noul", "choice", "score", "error"].includes(a.kind)) fail(`bad kind ${a.kind}`);
  }
  clearTimeout(timer);
  console.error(`smoke: PASS (${out.answers.map((a) => a.kind).join(", ")})`);
} finally {
  await transport?.close();
  stub?.server.close();
  rmSync(work, { recursive: true, force: true });
}
