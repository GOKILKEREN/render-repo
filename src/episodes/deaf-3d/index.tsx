import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Hud} from './hud';
import {SceneCanvas} from './scene';
import {SCENES} from './sceneSpec';

const SceneSlot: React.FC<{
  index: number;
  audio: string;
  totalFrames: number;
}> = ({index, audio, totalFrames}) => {
  const frame = useCurrentFrame();
  const flash = (frame * 5) % 43 < 2 ? 0.13 : 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#04060d'}}>
      <Audio src={staticFile(audio)} />
      <SceneCanvas index={index} frame={frame} totalFrames={totalFrames} />
      <Hud index={index} />
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          zIndex: 3,
          backgroundColor: `rgba(255,255,255,${flash})`,
          mixBlendMode: 'screen',
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          zIndex: 4,
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 1px, transparent 1px, transparent 5px)',
          opacity: 0.55,
        }}
      />
      {index === 7 ? (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            zIndex: 5,
            backgroundColor: '#000000',
            opacity: Math.min(
              1,
              Math.max(0, (frame / Math.max(1, totalFrames - 1) - 0.78) / 0.22),
            ),
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const Deaf3DMain: React.FC<{frames: number[]}> = ({frames}) => {
  let cursor = 0;
  const starts = frames.map((value) => {
    const start = cursor;
    cursor += value;
    return start;
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#04060d'}}>
      {SCENES.map((scene, index) => (
        <Sequence
          key={scene.id}
          from={starts[index]}
          durationInFrames={frames[index]}
        >
          <SceneSlot
            index={index}
            audio={scene.audio}
            totalFrames={frames[index]}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
