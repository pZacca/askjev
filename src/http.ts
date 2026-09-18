import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createJev, type Jev } from "./jev.js";
import { createServer } from "./server.js";

/** Header that carries the caller's Typesafe API key. */
export const API_KEY_HEADER = "x-api-key";

/** How a remote caller supplies the key; shown in the tool description and in auth errors. */
export const KEY_HINT = `Send your Typesafe API key in the ${API_KEY_HEADER} header, or as a bearer token in Authorization.`;

export interface HttpOptions {
  version: string;
  /** Path that serves MCP. Default "/mcp". */
  path?: string;
  /** Upstream API root forwarded to every client. Default: the SDK's. */
  baseURL?: string | undefined;
  /** Default Jev model forwarded to every client. Default: the SDK's. */
  defaultModel?: string | undefined;
  /** Builds the Jev adapter for one request's key. Tests inject a fake. */
  jevFor?: (apiKey: string) => Jev;
}

export type HttpHandler = (request: Request) => Promise<Response>;

/**
 * The remote, multi-tenant entry point over Streamable HTTP, on web-standard Request and
 * Response so it runs on Cloudflare Workers, Deno, Bun, or Node 22+.
 *
 * Stateless: every request gets a fresh server and transport, and the Typesafe client is
 * built from the key that request carried. The key is never stored. Initialize and
 * tools/list work without a key so registries can scan the server; only `ask` needs one.
 */
export function createHttpHandler(options: HttpOptions): HttpHandler {
  const path = options.path ?? "/mcp";
  const jevFor =
    options.jevFor ??
    ((apiKey: string) =>
      createJev({
        apiKey,
        ...(options.baseURL ? { baseURL: options.baseURL } : {}),
        ...(options.defaultModel ? { defaultModel: options.defaultModel } : {}),
      }));

  return async (request) => {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return Response.json({
        name: "askjev",
        version: options.version,
        mcp: path,
        auth: KEY_HINT,
        docs: "https://github.com/pZacca/askjev",
      });
    }
    if (url.pathname !== path) {
      return new Response("Not found", { status: 404 });
    }
    // Stateless: no sessions to resume (GET) or terminate (DELETE). A GET would otherwise open
    // an SSE stream that nothing can ever write to, and hold it open with keep-alives.
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
    }

    const apiKey = readApiKey(request.headers);
    const jev = apiKey ? lazyJev(() => jevFor(apiKey)) : missingKeyJev;
    const server = createServer(jev, options.version, { keyHint: KEY_HINT });
    // No sessionIdGenerator: stateless, one transport per request.
    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    await server.connect(transport);
    return transport.handleRequest(request);
  };
}

/** The dedicated header wins; a bearer token is accepted for clients that only have that field. */
export function readApiKey(headers: Headers): string | undefined {
  const direct = headers.get(API_KEY_HEADER)?.trim();
  if (direct) return direct;
  const auth = headers.get("authorization")?.trim();
  const match = auth?.match(/^bearer\s+(.+)$/i);
  return match?.[1]?.trim() || undefined;
}

/** Builds the client on first use, so initialize and tools/list never construct one. */
function lazyJev(build: () => Jev): Jev {
  let jev: Jev | undefined;
  return {
    systemOne: (request) => {
      jev ??= build();
      return jev.systemOne(request);
    },
  };
}

const missingKeyJev: Jev = {
  systemOne: async () => {
    throw new Error(`No Typesafe API key was sent. ${KEY_HINT}`);
  },
};
