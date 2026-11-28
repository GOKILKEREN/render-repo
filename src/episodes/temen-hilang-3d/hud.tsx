import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT} from '../../engine/fonts';
import {SCENES} from './sceneSpec';

const SafeArea: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{top: 150, right: 200, bottom: 250, left: 60}}>
    {children}
  </AbsoluteFill>
);

export const Hud: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const scene = SCENES[index];
  const accent = scene.accent;
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const isHook = index === 0;
  const isClop = index === 6;
  const isPunch = index === 7;
  const pulse = isClop ? 0.72 + 0.28 * Math.abs(Math.sin(frame * 0.42)) : 1;
  const pop = isPunch
    ? interpolate(frame, [0, 8, 16], [0.86, 1.06, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;
  const captionIn = interpolate(frame, [0, 7], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SafeArea>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontFamily: FONT.ui,
          fontSize: 24,
          letterSpacing: 2,
          color: accent,
          textShadow: `0 0 18px ${accent}80`,
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: accent,
            boxShadow: `0 0 20px ${accent}`,
          }}
        />
        {scene.day}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          fontFamily: FONT.ui,
          fontSize: 22,
          letterSpacing: 1,
          color: '#ffffffcc',
          opacity: pulse,
          textShadow: `0 0 16px ${accent}`,
        }}
      >
        {scene.cue}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 44,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          transform: `translateY(${captionIn}px) scale(${pop})`,
          transformOrigin: 'left bottom',
        }}
      >
        <div
          style={{
            fontFamily: FONT.title,
            fontWeight: 800,
            fontSize: isHook ? 60 : 56,
            lineHeight: 1.04,
            whiteSpace: 'pre-line',
            color: '#ffffff',
            textShadow: `0 4px 0 #000000, 0 0 26px ${accent}90`,
          }}
        >
          {scene.idCaption}
        </div>
        <div
          style={{
            fontFamily: FONT.ui,
            fontSize: 28,
            letterSpacing: 1,
            color: accent,
            textShadow: '0 2px 0 #000000',
          }}
        >
          {scene.enCaption}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: 0,
          width: '100%',
          height: 4,
          background: '#ffffff22',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: accent,
            boxShadow: `0 0 14px ${accent}`,
          }}
        />
      </div>
    </SafeArea>
  );
};
