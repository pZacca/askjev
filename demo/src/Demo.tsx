import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo } from "./Logo";
import { FLIP_AT } from "./script";
import { Terminal } from "./Terminal";

export const DEMO_FRAMES = FLIP_AT + 130;

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slideIn = spring({ frame, fps, config: { damping: 200, stiffness: 100 } });
  const flipOut = spring({ frame: frame - FLIP_AT, fps, config: { damping: 200, stiffness: 90 } });

  const translateY = interpolate(slideIn, [0, 1], [760, 0]);
  const rotateY = interpolate(frame, [0, durationInFrames], [10, -10]);
  const scale = interpolate(frame, [0, durationInFrames], [0.92, 1]);
  const flipRotateX = frame >= FLIP_AT ? interpolate(flipOut, [0, 1], [0, -90]) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#EEF2F7", perspective: 1000 }}>
      <Logo from={FLIP_AT + 6} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 1000 }}>
        <div
          style={{
            width: 940,
            height: 820,
            transform: `translateY(${translateY}px) rotateX(20deg) rotateY(${rotateY}deg) scale(${scale})`,
            transformStyle: "preserve-3d",
          }}
        >
          <div style={{ width: "100%", height: "100%", perspective: 1000 }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                transformOrigin: "center bottom",
                transform: `rotateX(${flipRotateX}deg)`,
                opacity: frame >= FLIP_AT + 40 ? 0 : 1,
              }}
            >
              <Terminal />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
