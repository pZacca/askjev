import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { AuthenticationError } from "@typesafe-ai/sdk";
import { describe, expect, it } from "vitest";
import { API_KEY_HEADER, createHttpHandler, type HttpHandler, readApiKey } from "../src/http.js";
import type { Jev } from "../src/jev.js";
import { fakeJev, route } from "./fake-jev.js";

const BASE = "http://askjev.test";

/** A handler whose Jev is built per key, recording every key it was asked for. */
function handlerFor(jev: Jev) {
  const keys: string[] = [];
  const handler = createHttpHandler({
    version: "0.0.0-test",
    jevFor: (apiKey) => {
      keys.push(apiKey);
      return jev;
    },
  });
  return { handler, keys };
}

/** An MCP client whose fetch goes straight to the handler, no socket involved. */
async function connect(handler: HttpHandler, headers: Record<string, string> = {}) {
  const transport = new StreamableHTTPClientTransport(new URL("/mcp", BASE), {
    fetch: (input, init) => handler(new Request(input, init)),
    requestInit: { headers },
  });
  const client = new Client({ name: "test", version: "0" });
  // @ts-expect-error The SDK's client transport types sessionId as `string | undefined`, which the Transport interface rejects under exactOptionalPropertyTypes.
  await client.connect(transport);
  return client;
}

const askYes = () => fakeJev([{ q0: route("noul") }, { q0: { type: "noul", noul: 0.9 } }]).jev;

const callAsk = (client: Client) =>
  client.callTool({ name: "ask", arguments: { state: "s", questions: [{ question: "Yes?" }] } });

const textOf = (result: Awaited<ReturnType<Client["callTool"]>>) =>
  (result.content as { type: string; text: string }[])[0]?.text ?? "";

describe("HTTP handler", () => {
  it("serves initialize and tools/list without a key, with the header in the description", async () => {
    const { handler, keys } = handlerFor(askYes());
    const client = await connect(handler);
    const { tools } = await client.listTools();

    expect(tools.map((t) => t.name)).toEqual(["ask"]);
    expect(tools[0]?.description).toContain(API_KEY_HEADER);
    expect(keys).toEqual([]);
  });

  it("builds a Jev from the key header and answers", async () => {
    const { handler, keys } = handlerFor(askYes());
    const client = await connect(handler, { [API_KEY_HEADER]: "key-1" });

    const result = await callAsk(client);

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({ answers: [{ kind: "noul", answer: 0.9 }] });
    expect(keys).toEqual(["key-1"]);
  });

  it("applies the configured include list to every caller", async () => {
    const handler = createHttpHandler({
      version: "0.0.0-test",
      include: ["model"],
      jevFor: () => askYes(),
    });
    const client = await connect(handler, { [API_KEY_HEADER]: "key-1" });

    const result = await callAsk(client);

    expect(result.structuredContent).toEqual({
      model: "jev-test",
      answers: [
        { kind: "noul", answer: 0.9, probabilities: { yes: 0.9, no: expect.closeTo(0.1) } },
      ],
    });
  });

  it("accepts a bearer token when the header is absent", async () => {
    const { handler, keys } = handlerFor(askYes());
    const client = await connect(handler, { Authorization: "Bearer key-2" });

    await callAsk(client);

    expect(keys).toEqual(["key-2"]);
  });

  it("calling ask without a key is a tool error naming the header, and Jev is not built", async () => {
    const { handler, keys } = handlerFor(askYes());
    const client = await connect(handler);

    const result = await callAsk(client);

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain(API_KEY_HEADER);
    expect(keys).toEqual([]);
  });

  it("a rejected key names the header, not the env var", async () => {
    const rejecting: Jev = {
      systemOne: async () => {
        throw new AuthenticationError(401, { error: "bad key" }, new Headers());
      },
    };
    const { handler } = handlerFor(rejecting);
    const client = await connect(handler, { [API_KEY_HEADER]: "bad" });

    const result = await callAsk(client);

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain(API_KEY_HEADER);
    expect(textOf(result)).not.toContain("TYPESAFE_API_KEY");
  });

  it("describes itself at the root and 404s elsewhere", async () => {
    const { handler } = handlerFor(askYes());

    const root = await handler(new Request(`${BASE}/`));
    expect(root.status).toBe(200);
    expect(await root.json()).toMatchObject({ name: "askjev", version: "0.0.0-test", mcp: "/mcp" });

    const other = await handler(new Request(`${BASE}/nope`, { method: "POST" }));
    expect(other.status).toBe(404);
  });

  it("refuses GET and DELETE on the MCP path, so no idle SSE stream is ever opened", async () => {
    const { handler } = handlerFor(askYes());

    for (const method of ["GET", "DELETE"]) {
      const res = await handler(
        new Request(`${BASE}/mcp`, { method, headers: { accept: "text/event-stream" } }),
      );
      expect(res.status).toBe(405);
      expect(res.headers.get("allow")).toBe("POST");
    }
  });
});

describe("readApiKey", () => {
  const h = (init: Record<string, string>) => readApiKey(new Headers(init));

  it("prefers the dedicated header over a bearer token", () => {
    expect(h({ [API_KEY_HEADER]: " a ", Authorization: "Bearer b" })).toBe("a");
  });

  it("reads a bearer token case-insensitively", () => {
    expect(h({ Authorization: "bearer  b " })).toBe("b");
  });

  it("ignores blanks and other auth schemes", () => {
    expect(h({ [API_KEY_HEADER]: "  " })).toBeUndefined();
    expect(h({ Authorization: "Basic xyz" })).toBeUndefined();
    expect(h({})).toBeUndefined();
  });
});
