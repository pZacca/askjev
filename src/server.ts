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

Requires a Typesafe API key. `;

/** How the caller supplies the Typesafe API key when nothing else is said: the stdio way. */
export const ENV_KEY_HINT = "Set TYPESAFE_API_KEY in the environment of the askjev process.";

export interface ServerOptions {
  /** Shown at the end of the tool description and in auth errors. Default: `ENV_KEY_HINT`. */
  keyHint?: string;
}

export function createServer(jev: Jev, version: string, options: ServerOptions = {}): McpServer {
  const keyHint = options.keyHint ?? ENV_KEY_HINT;
  const server = new McpServer({ name: "askjev", version });

  server.registerTool(
    "ask",
    {
      title: "Ask Jev",
      description: description + keyHint,
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
        return { isError: true, content: [{ type: "text", text: describeError(error, keyHint) }] };
      }
    },
  );

  return server;
}

export function describeError(error: unknown, keyHint = ENV_KEY_HINT): string {
  if (error instanceof AuthenticationError) {
    return `Jev rejected the API key. ${keyHint}`;
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
