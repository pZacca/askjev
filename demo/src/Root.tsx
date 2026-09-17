import "./index.css";
import { Composition } from "remotion";
import { Demo, DEMO_FRAMES } from "./Demo";
import { Terminal } from "./Terminal";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Demo" component={Demo} durationInFrames={DEMO_FRAMES} fps={30} width={1080} height={1080} />
      <Composition id="Terminal" component={Terminal} durationInFrames={DEMO_FRAMES} fps={30} width={940} height={820} />
    </>
  );
};
