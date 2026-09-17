import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexMono";

// Palette sampled from zacca.dev: near-black background, one green, one blue, white text.
export const mono = loadPlex("normal", { weights: ["400", "600", "700"], subsets: ["latin"] }).fontFamily;
export const sans = mono;

export const colors = {
  page: "#080808",
  bg: "#0f0f0f",
  bar: "#151515",
  line: "#262626",
  text: "#f2f2f2",
  muted: "#8a8a8a",
  accent: "#84ffb0",
  ok: "#84ffb0",
  warn: "#2b7fff",
  fill: "#2a2a2a",
};
