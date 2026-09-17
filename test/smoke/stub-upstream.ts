import { createServer, type Server } from "node:http";

interface Q {
  type: "noul" | "choice" | "score";
  criteria?: unknown;
}

/**
 * A deterministic stand-in for api.typesafe.ai. It answers every question with a valid shape
 * so the packaged server can be exercised end to end without a key or network.
 */
export function startStub(): Promise<{ server: Server; url: string }> {
  const server = createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/v1/systemone") {
      res.writeHead(404).end();
      return;
    }
    if (req.headers.authorization !== "Bearer smoke-key") {
      res
        .writeHead(401, { "content-type": "application/json" })
        .end(JSON.stringify({ error: "bad key" }));
      return;
    }
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      const body = JSON.parse(raw) as { model: string; questions: Record<string, Q> };
      const answers: Record<string, unknown> = {};
      for (const [name, q] of Object.entries(body.questions)) {
        if (q.type === "noul") answers[name] = { type: "noul", noul: 0.75 };
        else if (q.type === "choice") {
          const labels = Object.keys(q.criteria as object);
          const first = labels[0] ?? "";
          answers[name] = {
            type: "choice",
            choice: first,
            confidence: 0.9,
            probabilities: Object.fromEntries(
              labels.map((l, i) => [l, i === 0 ? 0.9 : 0.1 / (labels.length - 1)]),
            ),
          };
        } else {
          const levels = q.criteria as string[];
          answers[name] = {
            type: "score",
            score: levels.length - 1,
            confidence: 0.9,
            legend: Object.fromEntries(levels.map((l, i) => [String(i), l])),
            probabilities: Object.fromEntries(
              levels.map((_, i) => [String(i), i === levels.length - 1 ? 1 : 0]),
            ),
          };
        }
      }
      res.writeHead(200, { "content-type": "application/json" }).end(
        JSON.stringify({
          model: body.model,
          answers,
          usage: { input_tokens: 5, output_tokens: 1 },
        }),
      );
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}
