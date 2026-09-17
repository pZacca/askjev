#!/usr/bin/env node
import { createRequire } from "node:module";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createJev } from "./jev.js";
import { createServer } from "./server.js";

const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

async function main(): Promise<void> {
  const jev = createJev();
  const server = createServer(jev, version);
  await server.connect(new StdioServerTransport());
}

main().catch((error: unknown) => {
  // stdout is the MCP protocol channel; diagnostics go to stderr.
  console.error(`askjev: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
