import "./index.css";
import { Composition, Folder } from "remotion";
import { QUESTIONS } from "./data";
import { Demo, totalFrames } from "./Demo";
import { Outro } from "./scenes/Outro";
import { Question } from "./scenes/Question";
import { Task } from "./scenes/Task";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Demo" component={Demo} durationInFrames={totalFrames()} fps={30} width={1080} height={1080} />
      <Folder name="Scenes">
        <Composition id="Task" component={Task} durationInFrames={96} fps={30} width={1080} height={1080} />
        <Composition
          id="Question1"
          component={Question}
          defaultProps={{ data: QUESTIONS[0], index: 0, total: QUESTIONS.length }}
          durationInFrames={96}
          fps={30}
          width={1080}
          height={1080}
        />
        <Composition id="Outro" component={Outro} durationInFrames={120} fps={30} width={1080} height={1080} />
      </Folder>
    </>
  );
};
