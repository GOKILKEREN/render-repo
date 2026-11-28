import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {Hud} from './hud';
import {SceneCanvas} from './scene';
import {SCENES} from './sceneSpec';

const SceneSlot: React.FC<{
  index: number;
  audio: string;
  totalFrames: number;
}> = ({index, audio, totalFrames}) => {
  const frame = useCurrentFrame();
  const flash = (frame * 7) % 29 < 2 ? 0.16 : 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#05060c'}}>
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
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 4px)',
          opacity: 0.7,
        }}
      />
    </AbsoluteFill>
  );
};

export const TemenHilang3DMain: React.FC<{frames: number[]}> = ({frames}) => {
  let cursor = 0;
  const starts = frames.map((value) => {
    const start = cursor;
    cursor += value;
    return start;
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#05060c'}}>
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
