import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const sans = loadInter("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;
export const mono = loadMono("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily;

export const colors = {
  bg: "#0B0F17",
  panel: "#131A27",
  line: "#222C3D",
  text: "#E9EDF5",
  muted: "#8C95AA",
  accent: "#8B5CFF",
  ok: "#3DD68C",
  warn: "#F5B942",
};
