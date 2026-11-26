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

  if (index === 2) {
    return (
      <SafeArea>
        <div
          style={{
            ...mono,
            position: 'absolute',
            top: 20,
            right: 0,
            padding: '12px 22px',
            color: '#ff4d5e',
            background: 'rgba(12,0,8,0.72)',
            border: '3px solid rgba(255,77,94,0.7)',
            fontSize: 62,
            opacity: flicker,
            textShadow: '0 0 18px #ff1744, 0 0 42px #ff1744',
          }}
        >
          [OFFLINE]
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
            bottom: 40,
            left: 0,
            right: 0,
            textAlign: 'center',
            padding: '18px 12px',
            color: '#ffe66d',
            background: 'rgba(8,8,0,0.66)',
            border: '3px solid rgba(255,210,61,0.65)',
            fontSize: 46,
            opacity: flicker,
            textShadow: '0 0 16px #ffd23d, 0 0 40px #ff7b00',
          }}
        >
          [SYSTEM RECOVERY: REBOOT?]
        </div>
      </SafeArea>
    );
  }

  if (index === 7) {
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
            color: '#fff1f1',
            fontSize: 50,
            lineHeight: 1.12,
            whiteSpace: 'pre-line',
            opacity: flicker,
            textShadow: '0 0 18px #ff1744, 0 0 54px #ff1744',
          }}
        >
          {'[KICKED FROM SERVER.\nREASON: TOO ANNOYING]'}
        </div>
      </SafeArea>
    );
  }

  return null;
};
