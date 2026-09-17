# askjev

Unofficial [MCP](https://modelcontextprotocol.io) server for [Jev](https://docs.typesafe.ai),
Typesafe AI's System One model. Not affiliated with Typesafe AI.

Give your agent a fast second opinion. It asks a plain question about material it already
has, Jev works out whether that is a yes/no, a scale, or a choice, and answers with
calibrated probabilities. No generative model in the loop, one round trip, a fraction of the
cost and latency of a sub-agent.

## Demo

An agent planning a workflow, asking Jev one question at a time. Every number is real.

![An agent asks askjev five questions in a terminal and gets probabilities back](assets/askjev-demo.gif)

## Status

Not published yet. The pipeline works end to end against the live API and the router
scores 100% on the first evaluation dataset. See [docs/EVAL.md](docs/EVAL.md).

## Install

Requires Node 22+ and a Typesafe API key in `TYPESAFE_API_KEY`.

Claude Code:

```sh
claude mcp add askjev -e TYPESAFE_API_KEY=your-key -- npx -y askjev
```

Claude Desktop, Cursor, and other clients that take a JSON config:

```json
{
  "mcpServers": {
    "askjev": {
      "command": "npx",
      "args": ["-y", "askjev"],
      "env": { "TYPESAFE_API_KEY": "your-key" }
    }
  }
}
```

On Windows some hosts cannot launch `npx` directly. Use `"command": "cmd"` with
`"args": ["/c", "npx", "-y", "askjev"]`.

## The tool

`ask` takes the material and a list of questions. Options are only needed when the question
has named alternatives.

```json
{
  "state": "Customer writes: charged twice for one order, wants it fixed today.",
  "questions": [
    { "question": "Does the customer ask for a refund?" },
    { "question": "How frustrated is the customer?" },
    { "question": "Which team should handle this?", "options": ["billing", "platform", "mobile"] }
  ]
}
```

Each answer comes back with probabilities, Jev's confidence, and how the question was
routed. Read the confidence before acting on the answer.

Full contract, pipeline diagrams, and the reasoning behind the design:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). How the router is evaluated:
[docs/EVAL.md](docs/EVAL.md).

## Development

```sh
npm ci
npm run lint
npm run typecheck
npm test
```

## License

MIT
