# Router evaluation

The router is the part of `askjev` that can be wrong in a way unit tests cannot catch: Jev
may decide a question is a scale when it was a yes/no. This evaluation measures that
against the live API.

## What it is

A versioned dataset of questions with human-written expected routing. Not tests: an
evaluation with a report. It runs only when `TYPESAFE_API_KEY` is set, weekly on CI and on
demand, and never on pull requests from forks.

## Dataset

`eval/cases.json`. Each case has:

- `question`, and `options` when the case has them.
- `expect`: the expected `kind`. For a scale without options, also the expected rubric.
- `accept`: optional. For ambiguous wording, a set of routings that count as correct.
- `gate`: optional, `true` for the handful of clear cases that fail the run individually.
- `branch`: which routing branch the case exercises, for per-branch reporting.

Expected labels are written by a person without consulting Jev. A case that Jev gets
"wrong" is not changed to match Jev; either the label was wrong on review, or the case
stays as a known miss.

Coverage targets: every routing branch, every built-in rubric, paraphrases, ambiguous
wording, and options whose order is misleading.

## Metrics

- Individual pass/fail for gated cases.
- Aggregate accuracy, overall and per branch.
- Rubric accuracy measured in isolation, with the scale branch forced, so a type error does
  not hide a rubric error.
- API failures reported separately from semantic misses. A wrong answer is never retried
  until it passes.

With a few dozen cases, one miss moves accuracy by several points. Run the suite several
times to see the natural variation before reading anything into a single number.

## Report

Written to `eval/report/` (git-ignored) and uploaded as a CI artifact. It records the
dataset version, SDK version, requested and resolved model, and per-case predictions with
probabilities and confidence. Confidence drift over time is diagnostic, not a gate.

## Running

```sh
TYPESAFE_API_KEY=... npm run eval
```
