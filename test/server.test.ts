import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { AuthenticationError } from "@typesafe-ai/sdk";
import { describe, expect, it } from "vitest";
import type { Jev } from "../src/jev.js";
import { createServer, type ServerOptions } from "../src/server.js";
import { fakeJev, route } from "./fake-jev.js";

async function connect(jev: Jev, options: ServerOptions = {}) {
  const server = createServer(jev, "0.0.0-test", options);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

describe("MCP server", () => {
  it("exposes exactly one tool, ask, with the input contract", async () => {
    const client = await connect(fakeJev([]).jev);
    const { tools } = await client.listTools();

    expect(tools.map((t) => t.name)).toEqual(["ask"]);
    const ask = tools[0];
    expect(ask?.description).toContain("severity: trivial < minor < moderate < major < critical");
    expect(Object.keys(ask?.inputSchema.properties ?? {})).toEqual(["state", "questions"]);
    expect(ask?.inputSchema.required).toEqual(["state", "questions"]);
    expect(ask?.outputSchema).toBeDefined();
  });

  it("returns structured content on success", async () => {
    const { jev } = fakeJev([{ q0: route("noul") }, { q0: { type: "noul", noul: 0.9 } }]);
    const client = await connect(jev);

    const result = await client.callTool({
      name: "ask",
      arguments: { state: "s", questions: [{ question: "Yes?" }] },
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      answers: [
        {
          kind: "noul",
          answer: 0.9,
          probabilities: { yes: 0.9, no: expect.closeTo(0.1) },
          routing: { kind: "noul", confidence: 0.9 },
        },
      ],
    });
  });

  it("emits model and usage, and drops routing, as configured", async () => {
    const { jev } = fakeJev([{ q0: route("noul") }, { q0: { type: "noul", noul: 0.9 } }]);
    const client = await connect(jev, { include: ["model", "usage"] });

    const result = await client.callTool({
      name: "ask",
      arguments: { state: "s", questions: [{ question: "Yes?" }] },
    });

    expect(result.structuredContent).toEqual({
      model: "jev-test",
      usage: { input_tokens: 20, output_tokens: 2 },
      answers: [
        { kind: "noul", answer: 0.9, probabilities: { yes: 0.9, no: expect.closeTo(0.1) } },
      ],
    });
  });

  it("describes the configured output in the tool description", async () => {
    const byDefault = await connect(fakeJev([]).jev);
    const defaultText = (await byDefault.listTools()).tools[0]?.description ?? "";
    expect(defaultText).toContain('"routing"');
    expect(defaultText).not.toContain('"usage"');

    const bare = await connect(fakeJev([]).jev, { include: ["usage"] });
    const bareText = (await bare.listTools()).tools[0]?.description ?? "";
    expect(bareText).not.toContain('"routing"');
    expect(bareText).toContain('"usage"');
  });

  it("rejects invalid input before calling Jev", async () => {
    const { jev, requests } = fakeJev([]);
    const client = await connect(jev);

    const result = await client.callTool({
      name: "ask",
      arguments: { state: "s", questions: [{ question: "Which?", options: ["only-one"] }] },
    });

    expect(result.isError).toBe(true);
    expect(requests).toHaveLength(0);
  });

  it("turns an authentication failure into a readable tool error", async () => {
    const jev: Jev = {
      systemOne: async () => {
        throw new AuthenticationError(401, { error: "bad key" }, new Headers());
      },
    };
    const client = await connect(jev);

    const result = await client.callTool({
      name: "ask",
      arguments: { state: "s", questions: [{ question: "Yes?" }] },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as { type: string; text: string }[])[0]?.text ?? "";
    expect(text).toContain("TYPESAFE_API_KEY");
  });
});
