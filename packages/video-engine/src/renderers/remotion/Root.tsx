import type {ReactNode} from 'react';
import {AbsoluteFill, Audio, Composition, interpolate, registerRoot, Sequence, staticFile, useCurrentFrame} from 'remotion';
import captions from '../../../../../src/data/captions.json';
import timing from '../../../../../src/data/timing.json';

const FPS = 30;
const INK = '#211d18';
const PAPER = '#f2e6cd';
const RUST = '#b4472f';
const GOLD = '#d6a13b';
const SAGE = '#60745d';

type SceneProps = {
  frame: number;
  duration: number;
  id: string;
};

const ease = (x: number) => x * x * (3 - 2 * x);

const between = (frame: number, start: number, end: number, from: number, to: number) =>
  interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const appear = (frame: number, at = 0, length = 14) => ease(between(frame, at, at + length, 0, 1));
const vanish = (frame: number, at: number, length = 14) => ease(between(frame, at - length, at, 1, 0));

const STARS = Array.from({length: 96}, (_, i) => ({
  x: 18 + ((i * 137) % 814),
  y: 26 + ((i * 211) % 1410),
  r: 1 + ((i * 7) % 4) * 0.7,
  delay: (i * 13) % 90,
}));

const SafeArea = ({children}: {children: ReactNode}) => (
  <div style={{position: 'absolute', left: 80, right: 150, top: 150, bottom: 300, overflow: 'hidden'}}>
    {children}
  </div>
);

const SvgStage = ({children}: {children: ReactNode}) => (
  <svg viewBox="0 0 850 1470" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
    {children}
  </svg>
);

const Grain = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      opacity: 0.14,
      backgroundImage:
        'repeating-radial-gradient(circle at 20% 30%, rgba(33,29,24,0.13) 0 1px, transparent 1px 4px), repeating-radial-gradient(circle at 80% 70%, rgba(180,71,47,0.10) 0 1px, transparent 1px 5px)',
      mixBlendMode: 'multiply',
    }}
  />
);

const PaperBackground = ({frame}: {frame: number}) => {
  const warmth = between(frame, 0, 160, 0.06, 0.12);
  return (
    <AbsoluteFill
      style={{
        background: PAPER,
        backgroundImage: `radial-gradient(circle at 20% 15%, rgba(214,161,59,${warmth}) 0, transparent 38%), radial-gradient(circle at 86% 82%, rgba(96,116,93,0.12) 0, transparent 42%), linear-gradient(180deg, #f7edd8 0%, ${PAPER} 58%, #e8d9bb 100%)`,
      }}
    />
  );
};

const DayBadge = ({label, frame}: {label: string; frame: number}) => (
  <div
    style={{
      position: 'absolute',
      top: 16,
      left: 18,
      opacity: appear(frame, 0, 10),
      transform: `translateY(${between(frame, 0, 12, 18, 0)}px)`,
      padding: '10px 22px',
      border: `4px solid ${INK}`,
      borderRadius: 999,
      color: INK,
      background: 'rgba(247,237,216,0.86)',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: 31,
      fontWeight: 900,
      letterSpacing: 3,
    }}
  >
    {label}
  </div>
);

const SceneTitle = ({text, frame, delay = 8, color = INK}: {text: string; frame: number; delay?: number; color?: string}) => (
  <div
    style={{
      position: 'absolute',
      top: 110,
      left: 18,
      right: 18,
      opacity: appear(frame, delay, 15),
      transform: `translateY(${between(frame, delay, delay + 15, 28, 0)}px)`,
      color,
      fontFamily: 'Georgia, serif',
      fontSize: 76,
      lineHeight: 0.94,
      fontWeight: 900,
      letterSpacing: -2,
      textTransform: 'uppercase',
    }}
  >
    {text}
  </div>
);

const SmallNote = ({text, frame, delay = 22}: {text: string; frame: number; delay?: number}) => (
  <div
    style={{
      position: 'absolute',
      left: 20,
      right: 20,
      top: 360,
      opacity: appear(frame, delay, 14),
      fontFamily: 'Arial, sans-serif',
      fontSize: 38,
      lineHeight: 1.18,
      fontWeight: 700,
      color: INK,
    }}
  >
    {text}
  </div>
);

const Captions = ({frame}: {frame: number}) => {
  const cue = captions.find((item) => frame >= item.start * FPS && frame <= item.end * FPS);
  if (!cue) return null;
  const local = frame - cue.start * FPS;
  const cueFrames = Math.max(1, (cue.end - cue.start) * FPS);
  const opacity = Math.min(appear(local, 0, 6), vanish(local, cueFrames, 6));
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 150,
        bottom: 326,
        opacity,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 790,
          padding: '16px 22px',
          border: `3px solid ${INK}`,
          borderRadius: 18,
          background: 'rgba(247,237,216,0.80)',
          boxShadow: '7px 7px 0 rgba(33,29,24,0.16)',
          color: INK,
          fontFamily: 'Arial, sans-serif',
          fontSize: 43,
          lineHeight: 1.12,
          fontWeight: 800,
          textAlign: 'center',
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};

const Atom = ({frame, x, y, scale = 1}: {frame: number; x: number; y: number; scale?: number}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <circle r="34" fill={RUST} />
    <circle r="62" fill="none" stroke={INK} strokeWidth="5" opacity="0.8" />
    <ellipse rx="150" ry="54" fill="none" stroke={INK} strokeWidth="5" transform={`rotate(${frame * 1.1})`} />
    <ellipse rx="150" ry="54" fill="none" stroke={INK} strokeWidth="5" transform={`rotate(${frame * 1.1 + 60})`} />
    <ellipse rx="150" ry="54" fill="none" stroke={INK} strokeWidth="5" transform={`rotate(${frame * 1.1 + 120})`} />
    <circle cx="150" cy="0" r="13" fill={GOLD} />
    <circle cx="-75" cy="130" r="13" fill={GOLD} />
    <circle cx="-75" cy="-130" r="13" fill={GOLD} />
  </g>
);

const S01 = ({frame}: SceneProps) => (
  <SafeArea>
    <SvgStage>
      <g opacity={appear(frame, 4, 20)}>
        <Atom frame={frame} x={620} y={980} scale={0.72} />
      </g>
      <path
        d={`M 40 ${1180 + Math.sin(frame * 0.08) * 10} C 250 1110, 520 1240, 810 1130`}
        fill="none"
        stroke={RUST}
        strokeWidth="7"
        strokeLinecap="round"
        opacity={appear(frame, 18, 20)}
      />
    </SvgStage>
    <SceneTitle text={'WHAT IF\nIRON\nVANISHED?'} frame={frame} delay={0} />
    <SmallNote text="every atom. everywhere. now." frame={frame} delay={16} />
  </SafeArea>
);

const S02 = ({frame}: SceneProps) => {
  const lean = between(frame, 35, 100, 0, 14);
  return (
    <SafeArea>
      <DayBadge label="DAY 1" frame={frame} />
      <SceneTitle text="THE WORLD\nSTOPS" frame={frame} />
      <SvgStage>
        <g transform={`rotate(${lean} 420 900)`}>
          <rect x="70" y="700" width="710" height="34" rx="12" fill={INK} />
          <rect x="120" y="560" width="150" height="140" rx="8" fill={SAGE} opacity="0.72" />
          <rect x="300" y="500" width="180" height="200" rx="8" fill={INK} opacity="0.86" />
          <rect x="520" y="600" width="190" height="100" rx="8" fill={RUST} opacity="0.75" />
          <circle cx="170" cy="744" r="34" fill={INK} />
          <circle cx="610" cy="744" r="34" fill={INK} />
          <path d="M 70 700 L 780 700" stroke={GOLD} strokeWidth="9" />
        </g>
        <path d="M 40 1130 L 810 1130" stroke={INK} strokeWidth="8" />
        <path d="M 80 1130 L 760 1130" stroke={PAPER} strokeWidth="3" strokeDasharray="28 24" />
        <g opacity={appear(frame, 26, 18)}>
          <path d={`M ${110 + Math.sin(frame * 0.3) * 8} 1040 l 40 -80 l 40 80 z`} fill={RUST} />
          <path d={`M ${620 + Math.cos(frame * 0.3) * 8} 1040 l 40 -80 l 40 80 z`} fill={RUST} />
        </g>
      </SvgStage>
      <SmallNote text="trains freeze. towers twist." frame={frame} />
    </SafeArea>
  );
};

const S03 = ({frame}: SceneProps) => {
  const lose = between(frame, 70, 140, 1, 0);
  return (
    <SafeArea>
      <DayBadge label="DAY 1" frame={frame} />
      <SceneTitle text="BLOOD\nFAILS" frame={frame} />
      <SvgStage>
        <g transform="translate(425 780)">
          <ellipse rx="230" ry="150" fill={RUST} opacity="0.88" />
          <ellipse rx="150" ry="82" fill="#7c2418" opacity="0.85" />
          <circle r="58" fill={INK} opacity={0.25 * lose} />
          <circle cx={between(frame, 70, 140, 0, 310)} cy={between(frame, 70, 140, 0, -240)} r="24" fill={GOLD} opacity={lose} />
          <path d="M -190 210 C -80 150, 90 270, 210 190" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
        </g>
        <g opacity={appear(frame, 86, 16)}>
          <path d="M 100 1130 L 750 1130" stroke={INK} strokeWidth="8" />
          <text x="425" y="1210" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="42" fontWeight="800" fill={INK}>
            NO IRON = NO OXYGEN RIDE
          </text>
        </g>
      </SvgStage>
      <SmallNote text="hemoglobin drops its core." frame={frame} />
    </SafeArea>
  );
};

const S04 = ({frame}: SceneProps) => {
  const spin = between(frame, 30, 120, 0, -140);
  return (
    <SafeArea>
      <DayBadge label="DAY 7" frame={frame} />
      <SceneTitle text="FARMS\nFREEZE" frame={frame} />
      <SvgStage>
        <path d="M 40 1180 L 810 1180" stroke={INK} strokeWidth="8" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M ${80 + i * 125} 1180 q ${Math.sin(frame * 0.08 + i) * 18} -170 ${i % 2 ? 34 : -28} -300`}
            fill="none"
            stroke={SAGE}
            strokeWidth="9"
            strokeLinecap="round"
          />
        ))}
        <g transform={`translate(360 920) rotate(${spin})`}>
          <rect x="-120" y="-70" width="240" height="100" rx="14" fill={RUST} />
          <circle cx="-80" cy="70" r="52" fill={INK} />
          <circle cx="100" cy="70" r="52" fill={INK} />
          <rect x="120" y="-30" width="180" height="18" fill={INK} />
        </g>
        <g opacity={appear(frame, 60, 18)}>
          <path d="M 120 630 L 250 630 M 185 560 L 185 700" stroke={INK} strokeWidth="10" />
        </g>
      </SvgStage>
      <SmallNote text="no steel plows. no harvest." frame={frame} />
    </SafeArea>
  );
};

const S05 = ({frame}: SceneProps) => {
  const flat = between(frame, 40, 110, 1, 0);
  return (
    <SafeArea>
      <DayBadge label="DAY 7 TO 30" frame={frame} />
      <SceneTitle text="HOSPITALS\nOVERLOAD" frame={frame} />
      <SvgStage>
        <rect x="70" y="610" width="710" height="360" rx="22" fill="#e5d3b2" stroke={INK} strokeWidth="8" />
        <path
          d={`M 110 790 L 200 790 L 235 ${790 - 120 * flat} L 270 790 L 740 790`}
          fill="none"
          stroke={RUST}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <g transform="translate(170 1060)">
          <rect x="-26" y="-80" width="52" height="160" fill={INK} />
          <rect x="-80" y="-26" width="160" height="52" fill={INK} />
        </g>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${410 + i * 120} 1060)`} opacity={appear(frame, 50 + i * 12, 12)}>
            <rect x="-18" y="-70" width="36" height="140" rx="8" fill={SAGE} />
            <circle cy="-90" r="22" fill={INK} />
          </g>
        ))}
      </SvgStage>
      <SmallNote text="no surgical steel. no machines." frame={frame} />
    </SafeArea>
  );
};

const S06 = ({frame}: SceneProps) => {
  const flip = between(frame, 20, 120, 0, 22);
  return (
    <SafeArea>
      <DayBadge label="DAY 7 TO 30" frame={frame} />
      <SceneTitle text="TIME\nRUNS OUT" frame={frame} />
      <SvgStage>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${150 + i * 190} 720) rotate(${-8 + i * 8 + flip})`}>
            <rect x="-90" y="-130" width="180" height="260" rx="10" fill="#f8efdc" stroke={INK} strokeWidth="7" />
            <rect x="-90" y="-130" width="180" height="48" fill={RUST} />
            <text x="0" y="10" textAnchor="middle" fontFamily="Arial Black, Arial" fontSize="70" fontWeight="900" fill={INK}>
              {7 + i * 11}
            </text>
          </g>
        ))}
        <path d="M 100 1160 L 750 1160" stroke={INK} strokeWidth="8" />
        <path d="M 100 1160 l 30 -40 l 30 40 l 30 -40 l 30 40 l 30 -40 l 30 40" fill="none" stroke={RUST} strokeWidth="8" />
      </SvgStage>
      <SmallNote text="supermarkets empty in days." frame={frame} />
    </SafeArea>
  );
};

const S07 = ({frame}: SceneProps) => {
  const fade = vanish(frame, 210, 40);
  return (
    <SafeArea>
      <DayBadge label="DAY 30" frame={frame} />
      <SceneTitle text="EMPTY\nSHELVES" frame={frame} />
      <SvgStage>
        {[0, 1, 2].map((row) => (
          <g key={row}>
            <rect x="70" y={700 + row * 170} width="710" height="22" fill={INK} />
            {[0, 1, 2, 3, 4].map((col) => (
              <rect
                key={col}
                x={100 + col * 135}
                y={640 + row * 170}
                width="80"
                height="60"
                rx="8"
                fill={GOLD}
                opacity={(row === 1 && col === 3 ? fade : 0.08 * fade)}
              />
            ))}
          </g>
        ))}
        <circle cx="425" cy="1260" r="95" fill="none" stroke={RUST} strokeWidth="10" opacity={appear(frame, 60, 20)} />
        <path d="M 360 1260 L 490 1260 M 425 1195 L 425 1325" stroke={RUST} strokeWidth="10" />
      </SvgStage>
      <SmallNote text="food without tools becomes memory." frame={frame} />
    </SafeArea>
  );
};

const S08 = ({frame}: SceneProps) => {
  const sink = between(frame, 20, 130, 0, 90);
  return (
    <SafeArea>
      <DayBadge label="DAY 90" frame={frame} />
      <SceneTitle text="CITIES\nGO QUIET" frame={frame} />
      <SvgStage>
        <g transform={`translate(0 ${sink})`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M ${60 + i * 130} 1120 L ${60 + i * 130} ${760 - ((i * 53) % 260)} L ${150 + i * 130} ${700 - ((i * 37) % 210)} L ${150 + i * 130} 1120 Z`}
              fill={i % 2 ? INK : SAGE}
              opacity={0.45 + (i % 3) * 0.15}
            />
          ))}
        </g>
        <path d="M 40 1130 L 810 1130" stroke={INK} strokeWidth="9" />
        <g opacity={appear(frame, 70, 18)}>
          <path d="M 180 1130 l 60 -160 l 60 160" fill="none" stroke={RUST} strokeWidth="8" />
          <path d="M 560 1130 l 70 -190 l 70 190" fill="none" stroke={RUST} strokeWidth="8" />
        </g>
      </SvgStage>
      <SmallNote text="civilization steps backward." frame={frame} />
    </SafeArea>
  );
};

const S09 = ({frame}: SceneProps) => {
  const turn = between(frame, 20, 120, 0, 90);
  return (
    <SafeArea>
      <DayBadge label="DAY 90" frame={frame} />
      <SceneTitle text="WOOD.\nSTONE.\nCLAY." frame={frame} />
      <SvgStage>
        <g transform={`translate(240 920) rotate(${turn})`}>
          <circle r="150" fill="none" stroke={INK} strokeWidth="20" />
          <circle r="34" fill={GOLD} />
          {[0, 45, 90, 135].map((a) => (
            <path key={a} d="M 0 0 L 150 0" stroke={INK} strokeWidth="8" transform={`rotate(${a})`} />
          ))}
        </g>
        <g transform="translate(620 860) rotate(-22)" opacity={appear(frame, 40, 16)}>
          <path d="M 0 0 L 210 -70 L 230 -40 L 20 40 Z" fill={SAGE} stroke={INK} strokeWidth="6" />
        </g>
        <g transform="translate(570 1120)" opacity={appear(frame, 58, 16)}>
          <path d="M -110 0 C -90 -150, 90 -150, 110 0 Z" fill={RUST} stroke={INK} strokeWidth="7" />
        </g>
      </SvgStage>
      <SmallNote text="every old tool becomes impossible." frame={frame} />
    </SafeArea>
  );
};

const S10 = ({frame}: SceneProps) => {
  const fire = 1 + Math.sin(frame * 0.35) * 0.08;
  return (
    <SafeArea>
      <DayBadge label="DAY 365" frame={frame} />
      <SceneTitle text="A NEW\nWORLD" frame={frame} />
      <SvgStage>
        <path d="M 40 1180 L 810 1180" stroke={INK} strokeWidth="8" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${110 + i * 250} ${860 + (i % 2) * 80})`}>
            <path d="M -110 200 L 0 90 L 110 200 Z" fill={SAGE} stroke={INK} strokeWidth="7" />
            <rect x="-55" y="200" width="110" height="110" fill={GOLD} opacity="0.72" />
          </g>
        ))}
        <g transform={`translate(425 1280) scale(${fire})`}>
          <path d="M 0 0 C -70 -70, -30 -160, 10 -230 C 30 -140, 100 -120, 60 -30 Z" fill={RUST} />
          <path d="M 0 0 C -30 -50, -10 -100, 20 -140 C 35 -80, 60 -60, 35 -10 Z" fill={GOLD} />
        </g>
      </SvgStage>
      <SmallNote text="villages rise beside the ruins." frame={frame} />
    </SafeArea>
  );
};

const S11 = ({frame}: SceneProps) => {
  const bend = between(frame, 20, 110, 0, -18);
  return (
    <SafeArea>
      <DayBadge label="DAY 365" frame={frame} />
      <SceneTitle text="SLOWER.\nLOUDER.\nCLOSER." frame={frame} />
      <SvgStage>
        <g transform={`translate(260 760) rotate(${bend})`}>
          <path d="M 0 0 C 180 160, 180 420, 0 580" fill="none" stroke={INK} strokeWidth="18" />
          <path d="M 0 0 L 0 580" stroke={GOLD} strokeWidth="5" />
        </g>
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M ${80 + i * 190} 1320 q ${Math.sin(frame * 0.05 + i) * 24} -180 ${i % 2 ? 60 : -50} -300`}
            fill="none"
            stroke={SAGE}
            strokeWidth="10"
            strokeLinecap="round"
          />
        ))}
        <circle cx="650" cy="900" r="48" fill={RUST} opacity={appear(frame, 50, 18)} />
      </SvgStage>
      <SmallNote text="children learn the old skills." frame={frame} />
    </SafeArea>
  );
};

const S12 = ({frame}: SceneProps) => {
  const localEnd = Math.round(111.08 * FPS - (timing.scenes[11].start * FPS));
  const afterVoice = frame > localEnd;
  const recapIndex = Math.floor(Math.max(0, frame - localEnd) / 120) % 4;
  const recaps = [
    'IRON FORGED IN DYING STARS',
    'IRON CARRIED IN YOUR BLOOD',
    'IRON BURIED IN THE EARTH',
    'REMOVE IT. LOSE A YEAR.',
  ];
  return (
    <SafeArea>
      <DayBadge label="THE TWIST" frame={frame} />
      <SvgStage>
        <rect width="850" height="1470" fill="#1d1a16" />
        {STARS.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={i % 5 === 0 ? GOLD : '#f7edd8'}
            opacity={0.28 + 0.5 * Math.abs(Math.sin(frame * 0.02 + star.delay))}
          />
        ))}
        <g transform="translate(425 760)">
          <circle r="180" fill={SAGE} opacity="0.88" />
          <circle r="180" fill="none" stroke={GOLD} strokeWidth="8" />
          <path d="M -150 -40 C -60 -110, 70 -100, 150 -20" fill="none" stroke={PAPER} strokeWidth="10" opacity="0.6" />
          <path d="M -130 60 C -30 10, 70 30, 140 90" fill="none" stroke={PAPER} strokeWidth="8" opacity="0.45" />
        </g>
        <g opacity={afterVoice ? 0.32 : 1} transform="translate(425 760) scale(0.78)">
          <Atom frame={frame} x={0} y={0} />
        </g>
      </SvgStage>
      {!afterVoice ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 112,
              left: 18,
              right: 18,
              color: '#f7edd8',
              fontFamily: 'Georgia, serif',
              fontSize: 68,
              lineHeight: 0.98,
              fontWeight: 900,
              textTransform: 'uppercase',
            }}
          >
            IRON IS MADE
            <br />
            IN DYING STARS
          </div>
          <div
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              top: 360,
              color: GOLD,
              fontFamily: 'Arial, sans-serif',
              fontSize: 40,
              lineHeight: 1.14,
              fontWeight: 800,
            }}
          >
            TAKE IT AWAY, AND ONE YEAR REWINDS US.
          </div>
        </>
      ) : null}
      {afterVoice ? (
        <div
          key={recapIndex}
          style={{
            position: 'absolute',
            top: 126,
            left: 18,
            right: 18,
            color: '#f7edd8',
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 78,
            lineHeight: 0.98,
            fontWeight: 900,
            textTransform: 'uppercase',
            opacity: appear(frame, localEnd + recapIndex * 120, 12),
          }}
        >
          {recaps[recapIndex]}
        </div>
      ) : null}
    </SafeArea>
  );
};

const SCENES: Record<string, (props: SceneProps) => ReactNode> = {
  S01,
  S02,
  S03,
  S04,
  S05,
  S06,
  S07,
  S08,
  S09,
  S10,
  S11,
  S12,
};

const Video = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <PaperBackground frame={frame} />
      <Audio src={staticFile('audio/mix.mp3')} />
      {timing.scenes.map((scene) => {
        const start = Math.round(scene.start * FPS);
        const duration = Math.round((scene.end - scene.start) * FPS);
        return (
          <Sequence key={scene.id} from={start} durationInFrames={duration}>
            <SceneWithFrame id={scene.id} duration={duration} />
          </Sequence>
        );
      })}
      <Captions frame={frame} />
      <Grain />
    </AbsoluteFill>
  );
};

const SceneWithFrame = ({id, duration}: {id: string; duration: number}) => {
  const frame = useCurrentFrame();
  const Component = SCENES[id];
  return <Component id={id} frame={frame} duration={duration} />;
};

const RemotionRoot = () => (
  <>
    <Composition
      id="Video"
      component={Video}
      durationInFrames={timing.totalFrames}
      fps={timing.fps}
      width={timing.width}
      height={timing.height}
    />
    <Composition
      id="VideoVertical"
      component={Video}
      durationInFrames={timing.totalFrames}
      fps={timing.fps}
      width={timing.width}
      height={timing.height}
    />
  </>
);

registerRoot(RemotionRoot);
