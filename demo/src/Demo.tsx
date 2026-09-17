import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { QUESTIONS } from "./data";
import { Outro } from "./scenes/Outro";
import { Question } from "./scenes/Question";
import { Task } from "./scenes/Task";

export const QUESTION_FRAMES = 96;
export const TASK_FRAMES = 96;
export const OUTRO_FRAMES = 120;
export const FADE_FRAMES = 12;

export const totalFrames = () =>
  TASK_FRAMES + QUESTIONS.length * QUESTION_FRAMES + OUTRO_FRAMES - (QUESTIONS.length + 1) * FADE_FRAMES;

export const Demo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={96} name="Task">
        <Task />
      </TransitionSeries.Sequence>
      {QUESTIONS.map((q, i) => (
        <>
          <TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
          <TransitionSeries.Sequence key={`q${i}`} durationInFrames={96} name={`Question ${i + 1}`}>
            <Question data={q} index={i} total={QUESTIONS.length} />
          </TransitionSeries.Sequence>
        </>
      ))}
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence durationInFrames={120} name="Outro">
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
