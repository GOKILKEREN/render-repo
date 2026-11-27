import type {ReactNode} from 'react';
import {useCurrentFrame} from 'remotion';

const SafeArea: React.FC<{children: ReactNode}> = ({children}) => (
  <div
    style={{
      position: 'absolute',
      top: 150,
      right: 200,
      bottom: 250,
      left: 60,
      pointerEvents: 'none',
      zIndex: 2,
    }}
  >
    {children}
  </div>
);

const mono: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontWeight: 800,
  letterSpacing: 2,
};

export const Hud: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const flicker = (frame * 17) % 23 < 3 ? 0.42 : 1;

  if (index === 0) {
    return (
      <SafeArea>
        <div
          style={{
            ...mono,
            position: 'absolute',
            top: 24,
            right: 0,
            padding: '12px 20px',
            color: '#8ffcff',
            background: 'rgba(2,12,18,0.72)',
            border: '3px solid rgba(95,247,255,0.65)',
            fontSize: 44,
            opacity: flicker,
            textShadow: '0 0 16px #5ff7ff, 0 0 38px #5ff7ff',
          }}
        >
          [08:12 — SIGNAL LOST]
        </div>
      </SafeArea>
    );
  }

  if (index === 1) {
    return (
      <SafeArea>
        <div
          style={{
            ...mono,
            position: 'absolute',
            bottom: 48,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: '#e8c4ff',
            background: 'rgba(14,2,24,0.66)',
            border: '3px solid rgba(180,92,255,0.6)',
            fontSize: 44,
            opacity: flicker,
            textShadow: '0 0 18px #b45cff',
          }}
        >
          [NO AUDIO OUTPUT]
        </div>
      </SafeArea>
    );
  }

  if (index === 2) {
    return (
      <SafeArea>
        <div
          style={{
            ...mono,
            position: 'absolute',
            top: 24,
            right: 0,
            padding: '12px 22px',
            color: '#ff6675',
            background: 'rgba(16,0,4,0.72)',
            border: '3px solid rgba(255,77,94,0.7)',
            fontSize: 52,
            opacity: flicker,
            textShadow: '0 0 18px #ff1744, 0 0 42px #ff1744',
          }}
        >
          [OFFLINE]
        </div>
      </SafeArea>
    );
  }

  if (index === 3) {
    return (
      <SafeArea>
        <div
          style={{
            ...mono,
            position: 'absolute',
            bottom: 48,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: '#ffe66d',
            background: 'rgba(14,10,0,0.66)',
            border: '3px solid rgba(255,210,61,0.62)',
            fontSize: 44,
            opacity: flicker,
            textShadow: '0 0 18px #ffd23d',
          }}
        >
          [MUTE: CITY-WIDE]
        </div>
      </SafeArea>
    );
  }

  if (index === 4) {
    return (
      <SafeArea>
        <div
          style={{
            ...mono,
            position: 'absolute',
            bottom: 48,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: '#a8ffe0',
            background: 'rgba(0,16,12,0.68)',
            border: '3px solid rgba(125,255,208,0.65)',
            fontSize: 42,
            opacity: flicker,
            textShadow: '0 0 18px #7dffd0',
          }}
        >
          [QUIET MODE: 3B / 1]
        </div>
      </SafeArea>
    );
  }

  if (index === 5) {
    return (
      <SafeArea>
        <div
          style={{
            ...mono,
            position: 'absolute',
            top: 24,
            right: 0,
            padding: '12px 18px',
            color: '#ffb0e4',
            background: 'rgba(18,2,14,0.7)',
            border: '3px solid rgba(255,138,212,0.62)',
            fontSize: 42,
            opacity: flicker,
            textShadow: '0 0 18px #ff8ad4',
          }}
        >
          [WORDS: UNDELIVERED]
        </div>
      </SafeArea>
    );
  }

  if (index === 6) {
    return (
      <SafeArea>
        <div
          style={{
            ...mono,
            position: 'absolute',
            top: 24,
            right: 0,
            padding: '12px 20px',
            color: '#ffd08a',
            background: 'rgba(18,9,0,0.72)',
            border: '3px solid rgba(255,184,77,0.68)',
            fontSize: 48,
            opacity: flicker,
            textShadow: '0 0 20px #ffb84d',
          }}
        >
          [YOU: EXEMPT]
        </div>
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <div
        style={{
          ...mono,
          position: 'absolute',
          top: '34%',
          left: 0,
          right: 0,
          textAlign: 'center',
          color: '#fff0f2',
          fontSize: 54,
          lineHeight: 1.12,
          whiteSpace: 'pre-line',
          opacity: flicker,
          textShadow: '0 0 18px #ff1744, 0 0 54px #ff1744',
        }}
      >
        {'[YOU TALK TOO MUCH]'}
      </div>
    </SafeArea>
  );
};
