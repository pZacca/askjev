import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { APIError, AuthenticationError, TypeSafeError } from "@typesafe-ai/sdk";
import { ask } from "./ask.js";
import type { Jev } from "./jev.js";
import { RUBRICS } from "./rubrics.js";
import { askInputShape, askOutputShape } from "./schema.js";

const rubricLines = Object.entries(RUBRICS)
  .map(([name, levels]) => `  - ${name}: ${levels.join(" < ")}`)
  .join("\n");

const description = `Ask Jev, a fast non-generative judgment model, one or more questions about some material you already have. Use it for a quick second opinion, a classification, a rating, or a yes/no check instead of reasoning it out yourself or spawning a sub-agent.

Write each question in plain language. Jev decides whether it is a yes/no question, a scale, or a choice:
- Yes/no: "Does this ticket ask for a refund?" You get the probability of yes.
- Choice: pass "options" with the named alternatives. "Which team owns this?" with options ["billing", "platform"].
- Scale: pass "options" as ordered levels, lowest first. "How urgent is this?" with options ["can wait", "this week", "today"]. Without options, a built-in rubric is picked for you:
${rubricLines}

Every answer carries probabilities and Jev's confidence, plus "routing" showing how the question was interpreted. Read the confidence: a low value means the material does not settle the question, so add context or decide another way.

Requires TYPESAFE_API_KEY in the server's environment.`;

export function createServer(jev: Jev, version: string): McpServer {
  const server = new McpServer({ name: "askjev", version });

  server.registerTool(
    "ask",
    {
      title: "Ask Jev",
      description,
      inputSchema: askInputShape,
      outputSchema: askOutputShape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (input) => {
      try {
        const output = await ask(jev, input);
        return {
          content: [{ type: "text", text: JSON.stringify(output) }],
          structuredContent: output,
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: describeError(error) }] };
      }
    },
  );

  return server;
}

export function describeError(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return "Jev rejected the API key. Set TYPESAFE_API_KEY in the environment of the askjev process.";
  }
  if (error instanceof APIError) {
    const id = error.requestId ? ` (request ${error.requestId})` : "";
    return `Jev returned HTTP ${error.status}${id}: ${error.message}`;
  }
  if (error instanceof TypeSafeError || error instanceof Error) {
    return error.message;
  }
  return String(error);
}
