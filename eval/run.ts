// Router accuracy evaluation against the live Jev API. See docs/EVAL.md.
// Pending: dataset and runner land with the router implementation.
if (!process.env.TYPESAFE_API_KEY) {
  console.error("eval: TYPESAFE_API_KEY is not set, skipping");
  process.exit(0);
}
console.error("eval: not implemented yet");
