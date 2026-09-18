/**
 * Cloudflare Workers entry. Bundled by wrangler, not by tsc; see wrangler.jsonc.
 * The version is injected at deploy time with `--define ASKJEV_VERSION:'x.y.z'`.
 */
import { createHttpHandler, type HttpHandler } from "./http.js";

declare const ASKJEV_VERSION: string | undefined;

interface Env {
  TYPESAFE_BASE_URL?: string;
  TYPESAFE_DEFAULT_MODEL?: string;
}

let handler: HttpHandler | undefined;

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    handler ??= createHttpHandler({
      version: typeof ASKJEV_VERSION === "string" ? ASKJEV_VERSION : "0.0.0-dev",
      baseURL: env.TYPESAFE_BASE_URL,
      defaultModel: env.TYPESAFE_DEFAULT_MODEL,
    });
    return handler(request);
  },
};
