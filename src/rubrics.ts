/**
 * Built-in rubrics for scale questions that arrive without options.
 * All have five levels, lowest to highest, so Jev can discriminate without the levels blurring.
 */
export const RUBRICS = {
  intensity: ["not at all", "slightly", "moderately", "very", "extremely"],
  quality: ["poor", "below average", "acceptable", "good", "excellent"],
  severity: ["trivial", "minor", "moderate", "major", "critical"],
  likelihood: ["very unlikely", "unlikely", "uncertain", "likely", "very likely"],
  sentiment: ["very negative", "negative", "neutral", "positive", "very positive"],
  frequency: ["never", "rarely", "sometimes", "often", "always"],
  agreement: ["strongly disagree", "disagree", "neutral", "agree", "strongly agree"],
} as const satisfies Record<string, readonly [string, string, ...string[]]>;

export type RubricName = keyof typeof RUBRICS;

export const RUBRIC_NAMES = Object.keys(RUBRICS) as RubricName[];
