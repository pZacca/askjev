/**
 * Cloudflare Workers entry. Bundled by wrangler, not by tsc; see wrangler.jsonc.
 * The version is injected at deploy time with `--define ASKJEV_VERSION:'x.y.z'`.
 */
import { createHttpHandler, type HttpHandler } from "./http.js";
import { parseInclude } from "./include.js";

declare const ASKJEV_VERSION: string | undefined;

interface Env {
  TYPESAFE_BASE_URL?: string;
  TYPESAFE_DEFAULT_MODEL?: string;
  /** Comma-separated optional result parts, applied to every caller. See `parseInclude`. */
  ASKJEV_INCLUDE?: string;
}

let handler: HttpHandler | undefined;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      handler ??= createHttpHandler({
        version: typeof ASKJEV_VERSION === "string" ? ASKJEV_VERSION : "0.0.0-dev",
        baseURL: env.TYPESAFE_BASE_URL,
        defaultModel: env.TYPESAFE_DEFAULT_MODEL,
        include: parseInclude(env.ASKJEV_INCLUDE),
      });
    } catch (error) {
      // A bad ASKJEV_INCLUDE is an operator mistake; say so instead of a bare 500.
      const message = error instanceof Error ? error.message : String(error);
      return new Response(`askjev is misconfigured: ${message}`, { status: 500 });
    }
    return handler(request);
  },
};
