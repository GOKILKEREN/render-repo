import React from 'react';
import {
  camT, kf, clamp, easeOut, easeIn, rnd,
  poseAt, faceAt, basePose, toWorld, joints, HEAD, Hero, Pose, LOOKS,
  Shore, Reef, Fish, Bubbles,
  Schematic, SchLabel, DrawOn, Arrow, SCH, Dial, Glow, LightVeil, TitleCard, Foreground, Sparkle,
  ShotProps,
} from '../../engine';

const PIP = LOOKS.pipHood;
const MO = LOOKS.mo;
const CYAN = '#8FF0FF';
const GOLD = '#FFD27A';

const Coin: React.FC<{ x: number; y: number; r: number; rot?: number }> = ({ x, y, r, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <ellipse cx={4} cy={9} rx={r} ry={r * 0.92} fill="#0A1D32" opacity={0.4} />
    <ellipse cx={0} cy={0} rx={r} ry={r * 0.92} fill="#B8863C" stroke="#6D4E28" strokeWidth={r * 0.07} />
    <ellipse cx={-r * 0.08} cy={-r * 0.08} rx={r * 0.8} ry={r * 0.73} fill={GOLD} stroke="#FFF0C0" strokeWidth={r * 0.05} opacity={0.95} />
    <path d={`M 0 ${-r * 0.5} L ${r * 0.14} ${-r * 0.14} L ${r * 0.5} ${-r * 0.14} L ${r * 0.2} ${r * 0.08} L ${r * 0.31} ${r * 0.44} L 0 ${r * 0.2} L ${-r * 0.31} ${r * 0.44} L ${-r * 0.2} ${r * 0.08} L ${-r * 0.5} ${-r * 0.14} L ${-r * 0.14} ${-r * 0.14} Z`} fill="#C99749" opacity={0.8} />
    <path d={`M ${-r * 0.6} ${-r * 0.5} Q ${-r * 0.1} ${-r * 0.85} ${r * 0.5} ${-r * 0.6}`} stroke="#FFFFFF" strokeWidth={r * 0.09} fill="none" opacity={0.7} strokeLinecap="round" />
  </g>
);

const Gills: React.FC<{ pose: Pose; on?: number }> = ({ pose, on = 1 }) => {
  const neck = toWorld(pose, { x: 0, y: -112 });
  return (
    <g transform={`translate(${neck.x} ${neck.y}) scale(${pose.scale})`} opacity={on}>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path d={`M ${-13 + i * 12} -12 Q ${-8 + i * 12} 0 ${-13 + i * 12} 12`} stroke="#1B5A66" strokeWidth={9} strokeLinecap="round" fill="none" />
          <path d={`M ${-13 + i * 12} -12 Q ${-8 + i * 12} 0 ${-13 + i * 12} 12`} stroke={CYAN} strokeWidth={4.5} strokeLinecap="round" fill="none" style={{ filter: `drop-shadow(0 0 8px ${CYAN})` }} />
        </g>
      ))}
    </g>
  );
};

const Swim: React.FC<{ x: number; y: number; scale: number; spin: number; yaw: number; extra?: Partial<Pose>; face?: 'neutral' | 'happy' | 'smug' | 'shock' | 'worried' | 'oops' }> = ({ x, y, scale, spin, yaw, extra = {}, face = 'neutral' }) => (
  <Hero
    look={PIP}
    rimId="rimBlue"
    shadow={0}
    pose={{ ...basePose, x, y, scale, spin, yaw, facing: 1, legL: { a: 24, b: -54 }, legR: { a: -18, b: -40 }, armL: { a: 118, b: -18 }, armR: { a: 128, b: -22 }, sway: 8, expr: face, glint: 0.5, glintColor: CYAN, ...extra }}
  />
);

const DialSmall: React.FC<{ x: number; y: number; value: number; r?: number }> = ({ x, y, value, r = 54 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#0B0816" opacity={0.8} />
    <circle r={r} fill="none" stroke={CYAN} strokeWidth={5} opacity={0.85} />
    <circle r={r} fill="none" stroke="#FF5A4A" strokeWidth={7} strokeDasharray={2 * Math.PI * r} strokeDashoffset={2 * Math.PI * r * (1 - value / 10)} transform="rotate(-90)" />
    <text y={r * 0.34} textAnchor="middle" fontFamily="monospace" fontSize={r * 0.95} fill={value <= 2 ? '#FF5A4A' : CYAN}>{value}</text>
  </g>
);

export const S1: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 790, y: 812, scale: 1.05, yaw: 0.35, headTilt: 4, armL: { a: 18, b: -10 }, armR: { a: 20, b: -12 }, legL: { a: 16, b: -8 }, legR: { a: -14, b: 6 } } },
    { f: 13, p: { x: 900, y: 790, tilt: 12, armR: { a: 150, b: 20 }, armL: { a: 64, b: 10 } }, ease: easeOut },
    { f: len, p: { x: 1060, y: 738, tilt: 30, spin: 46, armR: { a: 168, b: 0 }, armL: { a: 150, b: 0 }, legL: { a: 34, b: -20 }, legR: { a: 34, b: -20 } }, ease: easeIn },
  ]);
  return (
    <g transform={camT(kf(t, [[0, 960], [len, 1010]]), kf(t, [[0, 560], [len, 580]]), kf(t, [[0, 0.98], [len, 1.04]]))}>
      <Shore t={t + 40} id="sh1" />
      {t > 8 ? (
        <g opacity={clamp((t - 8) / 8)}>
          <ellipse cx={pose.x + 30} cy={914} rx={90 + t * 4} ry={16} fill="#DFF9FF" opacity={0.35} />
          {Array.from({ length: 9 }).map((_, i) => (
            <circle key={i} cx={pose.x + 40 + (rnd(5, i) - 0.5) * 170} cy={900 - ((t * 4 + i * 19) % 100)} r={2 + rnd(6, i) * 5} fill="#DFF9FF" opacity={0.8} />
          ))}
        </g>
      ) : null}
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'neutral'], [12, 'happy']]) }} rimId="rimR" shadow={0.6} />
      <Foreground blur={10}>
        <path d="M -100 1080 Q 120 900 240 880 Q 180 980 220 1080 Z" fill="#1B2636" />
        <path d="M 1820 1080 Q 1700 860 1780 820 Q 1860 900 1940 1080 Z" fill="#18222F" />
      </Foreground>
    </g>
  );
};

export const S2: React.FC<ShotProps> = ({ t, len }) => {
  const pose: Pose = {
    ...basePose, x: kf(t, [[0, 1010], [len, 880]]), y: kf(t, [[0, 330], [len, 560]]), scale: 1.35,
    spin: -74, yaw: -0.25, facing: 1, legL: { a: 22, b: -60 }, legR: { a: -14, b: -44 },
    armL: { a: 130, b: -14 }, armR: { a: 120, b: -10 }, sway: 14, expr: 'happy', glint: 0.8, glintColor: CYAN,
  };
  return (
    <g transform={camT(kf(t, [[0, 940], [len, 900]]), kf(t, [[0, 480], [len, 520]]), kf(t, [[0, 1.55], [len, 1.68]]))}>
      <Reef t={t + 10} id="rf2" />
      <Fish x={520} y={600} s={0.8} dir={-1} t={t} seed={2} />
      <Fish x={1360} y={400} s={0.7} dir={1} t={t} seed={5} />
      <Bubbles x={960} y={360} t={t} seed={8} n={10} scale={0.7} />
      <Swim x={pose.x} y={pose.y} scale={pose.scale} spin={pose.spin} yaw={pose.yaw} extra={{ legL: pose.legL, legR: pose.legR, armL: pose.armL, armR: pose.armR, sway: pose.sway }} face="happy" />
      <Gills pose={pose} on={clamp((t + 2) / 6)} />
      <LightVeil id="s2veil" lights={[[1080, 260, 520]]} o={0.28} />
      <Foreground blur={10}>
        <path d="M 1500 1080 Q 1380 700 1560 520 Q 1500 800 1660 1080 Z" fill="#092034" opacity={0.9} />
      </Foreground>
    </g>
  );
};

export const S3: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 1 + clamp(t / len) * 0.06;
  const pose: Pose = { ...basePose, x: 960, y: 660, scale: 1.15, spin: -18, yaw: 0, legL: { a: 30, b: -40 }, legR: { a: -24, b: -34 }, armL: { a: 140, b: 10 }, armR: { a: 140, b: 10 }, expr: 'shock', glint: 0.5, glintColor: CYAN };
  return (
    <g transform={camT(960, kf(t, [[0, 430], [len, 410]]), kf(t, [[0, 1.42], [len, 1.52]]))}>
      <g transform={`translate(960 430) scale(${sc}) translate(-960 -430)`}>
        <Reef t={t + 31} id="rf3" surfaceY={-60} />
        {Array.from({ length: 11 }).map((_, i) => {
          const side = i % 2 ? 1 : -1;
          const x = 960 + side * (90 + i * 42 + t * 7);
          const y = 240 + (i % 5) * 82 + Math.sin(t / 5 + i) * 10;
          return <Fish key={i} x={x} y={y} s={0.52 + (i % 3) * 0.13} dir={side} t={t} seed={i + 10} />;
        })}
        <Bubbles x={960} y={720} t={t + 20} seed={14} n={12} scale={0.8} />
        <Swim x={pose.x} y={pose.y} scale={pose.scale} spin={pose.spin} yaw={pose.yaw} extra={{ legL: pose.legL, legR: pose.legR, armL: pose.armL, armR: pose.armR }} face="happy" />
        <Gills pose={pose} />
      </g>
    </g>
  );
};

export const S4: React.FC<ShotProps> = ({ t, len }) => {
  const hand = { x: kf(t, [[0, 1520], [10, 1140], [17, 990], [len, 930]]), y: kf(t, [[0, 210], [10, 400], [17, 530], [len, 560]]) };
  const grab = clamp((t - 15) / 6);
  return (
    <g transform={camT(960, kf(t, [[0, 600], [len, 590]]), kf(t, [[0, 1.02], [len, 1.08]]))}>
      <Reef t={t + 51} id="rf4" surfaceY={-400} />
      <LightVeil id="s4veil" lights={[[900, 520, 620]]} o={0.5} />
      <Glow x={920} y={480} r={520} kind="cool" o={0.4} />
      <ellipse cx={900} cy={690} rx={210} ry={44} fill="#0A1D32" opacity={0.35} />
      <path d="M 620 650 Q 900 610 1180 660 L 1180 780 Q 900 730 620 780 Z" fill="#7B8B79" opacity={0.45} />
      <Coin x={900} y={600} r={120} rot={-12} />
      <path d="M 790 620 Q 900 570 1010 620 L 1020 700 Q 900 650 780 700 Z" fill="#7B8B79" opacity={0.75} />
      <g filter="url(#rimBlue)">
        <path d={`M ${hand.x + 60} ${hand.y + 30} Q ${hand.x + 260} ${hand.y - 260} ${hand.x + 520} -340`} stroke={PIP.line} strokeWidth={130} fill="none" strokeLinecap="round" />
        <path d={`M ${hand.x + 60} ${hand.y + 30} Q ${hand.x + 260} ${hand.y - 260} ${hand.x + 520} -340`} stroke={PIP.limb} strokeWidth={108} fill="none" strokeLinecap="round" />
        <g transform={`translate(${hand.x} ${hand.y}) rotate(-34) scale(5.1)`}>
          <ellipse cx={0} cy={10} rx={11} ry={15} fill={PIP.hand} stroke={PIP.line} strokeWidth={4} />
          <ellipse cx={-10} cy={2} rx={5.5} ry={9} fill={PIP.hand} stroke={PIP.line} strokeWidth={4} />
          <path d="M -4 17 L -4 23 M 3 18 L 3 24" stroke={PIP.line} strokeWidth={2} opacity={0.45} strokeLinecap="round" />
        </g>
      </g>
      {grab > 0 ? (
        <g transform={`translate(${hand.x - 20} ${hand.y + 32}) scale(${0.5 + grab * 0.7})`}>
          <Coin x={0} y={0} r={108} rot={-12 + grab * 14} />
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx={Math.cos(i * 0.79) * (120 + grab * 50)} cy={Math.sin(i * 0.79) * (90 + grab * 40)} r={3 + rnd(8, i) * 6} fill="#DFF9FF" opacity={0.8 * (1 - grab)} />
          ))}
        </g>
      ) : null}
      <Bubbles x={hand.x + 40} y={hand.y} t={t + 60} seed={9} n={7} scale={0.6} />
    </g>
  );
};

export const S5: React.FC<ShotProps> = ({ t, len }) => {
  const pose: Pose = { ...basePose, x: 960, y: 520, scale: 1.28, yaw: 0.15, legL: { a: 28, b: -50 }, legR: { a: -22, b: -44 }, armL: { a: 30, b: -16 }, armR: { a: 150, b: 24 }, headTilt: -5, expr: 'smug', glint: 0.55, glintColor: CYAN };
  const hand = toWorld(pose, joints(pose).armR.end);
  return (
    <g transform={camT(kf(t, [[0, 960], [len, 975]]), 540, kf(t, [[0, 1.7], [len, 1.78]]))}>
      <Reef t={t + 80} id="rf5" surfaceY={20} />
      <Bubbles x={700} y={860} t={t + 12} seed={7} n={11} scale={0.8} />
      <Swim x={pose.x} y={pose.y} scale={pose.scale} spin={0} yaw={pose.yaw} extra={{ legL: pose.legL, legR: pose.legR, armL: pose.armL, armR: pose.armR, headTilt: pose.headTilt }} face="smug" />
      <Gills pose={pose} />
      <Coin x={hand.x + 4} y={hand.y - 46} r={34} rot={-12 + Math.sin(t / 5) * 5} />
      <Sparkle x={hand.x + 56} y={hand.y - 84} t={t - 8} s={1.15} />
      <DialSmall x={780} y={380} value={Math.max(0, 10 - Math.floor(t / 5))} r={46} />
      <Foreground blur={10}>
        <path d="M -120 1080 Q 80 720 260 640 Q 180 860 240 1080 Z" fill="#092034" />
      </Foreground>
    </g>
  );
};

export const S6: React.FC<ShotProps> = ({ t, len }) => {
  const pipX = kf(t, [[0, 600], [len, 1360]]);
  const moX = kf(t, [[0, 420], [len, 1060]]);
  const pipPose: Pose = { ...basePose, x: pipX, y: 520, scale: 0.95, spin: 76, yaw: 0.3, legL: { a: 20, b: -60 }, legR: { a: -16, b: -44 }, armL: { a: 140, b: -14 }, armR: { a: 130, b: -10 }, sway: 12, expr: 'happy' };
  const moPose: Pose = { ...basePose, x: moX, y: 590, scale: 0.95, spin: 72, yaw: 0.3, facing: 1, legL: { a: 26, b: -54 }, legR: { a: -18, b: -40 }, armL: { a: 132, b: 0 }, armR: { a: 120, b: 0 }, sway: 10, expr: 'happy' };
  return (
    <g transform={camT(kf(t, [[0, 880], [len, 1080]]), 540, kf(t, [[0, 1.08], [len, 1.12]]))}>
      <Reef t={t + 120} id="rf6" surfaceY={40} />
      {Array.from({ length: 7 }).map((_, i) => (
        <Fish key={i} x={180 + i * 280 + Math.sin(t / 8 + i) * 20} y={260 + (i % 3) * 130} s={0.5} dir={-1} t={t} seed={i + 20} />
      ))}
      <Hero look={MO} pose={moPose} rimId="rimBlue" shadow={0} />
      <Swim x={pipPose.x} y={pipPose.y} scale={pipPose.scale} spin={pipPose.spin} yaw={pipPose.yaw} extra={{ legL: pipPose.legL, legR: pipPose.legR, armL: pipPose.armL, armR: pipPose.armR, sway: pipPose.sway }} face="happy" />
      <Gills pose={pipPose} />
      <Bubbles x={moX - 90} y={590} t={t + 4} seed={11} n={10} scale={0.7} />
      <Bubbles x={pipX - 100} y={520} t={t} seed={12} n={9} scale={0.65} />
      <Foreground blur={10}>
        <path d="M 1720 1080 Q 1600 760 1760 620 Q 1740 900 1880 1080 Z" fill="#082034" />
      </Foreground>
    </g>
  );
};

export const S7: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 3.15;
  const head = { x: 720, y: 530 };
  const mo: Pose = { ...basePose, x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: 0.24, look: 0.6, armL: { a: 40, b: 30 }, armR: { a: 140, b: 10 }, sway: 6, ...faceAt(t, [[0, 'happy'], [14, 'shock']]) };
  const zoom = kf(t, [[0, 1], [len, 1.08]]);
  return (
    <g transform={`translate(960 540) scale(${zoom}) translate(-960 -540)`}>
      <g filter="url(#blur16)">
        <g transform="translate(-620 -520) scale(1.85)">
          <Reef t={t + 160} id="rf7" surfaceY={-30} />
        </g>
      </g>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#07182A" opacity={0.3} />
      <g opacity={clamp((t - 10) / 8)} filter="url(#blur6)">
        <g transform={`translate(${kf(t, [[10, 1600], [len, 400]])} 600) rotate(76) scale(1.2)`}>
          <ellipse rx={190} ry={64} fill="#2E2B3D" />
          <circle cx={160} r={62} fill="#F6EFE3" />
        </g>
      </g>
      <Hero look={MO} pose={mo} rimId="rimBlue" shadow={0} />
      <DialSmall x={1310} y={700} value={Math.max(0, 10 - Math.floor(t / 6))} r={110} />
      <Bubbles x={560} y={900} t={t + 30} seed={15} n={8} scale={1.1} />
    </g>
  );
};

export const S8: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 960, y: 830, scale: 1.05, yaw: 0, armL: { a: 110, b: 40 }, armR: { a: 120, b: 40 }, legL: { a: 8, b: 0 }, legR: { a: -8, b: 0 } } },
    { f: 18, p: { x: 960, y: 770, armL: { a: 148, b: 20 }, armR: { a: 150, b: 20 } }, ease: easeOut },
    { f: len, p: { x: 960, y: 762, armL: { a: 145, b: 24 }, armR: { a: 150, b: 20 } } },
  ]);
  const j = joints(pose);
  const hands = toWorld(pose, j.armR.end);
  return (
    <g transform={camT(960, kf(t, [[0, 560], [len, 550]]), kf(t, [[0, 0.98], [len, 1.05]]))}>
      <Shore t={t + 200} id="sh8" sunX={1100} sunY={560} />
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={800 + rnd(9, i) * 320} cy={850 - ((t * 4 + i * 21) % 110)} r={2 + rnd(10, i) * 6} fill="#DFF9FF" opacity={0.7} />
      ))}
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'neutral'], [14, 'happy']]) }} rimId="rimR" shadow={0} />
      <Coin x={hands.x} y={hands.y - 20} r={30} />
      <TitleCard t={t} lines={['WHAT IF YOU COULD', 'BREATHE UNDERWATER?']} accent="BREATHE" accentT={26} size={104} y={175} />
    </g>
  );
};

export const S9: React.FC<ShotProps> = ({ t, len }) => {
  const value = t < 40 ? Math.max(0, 10 - Math.floor(t / 4)) : 10;
  return (
    <g transform={camT(960, 540, kf(t, [[0, 1.25], [len, 1.36]]))}>
      <Reef t={t + 260} id="rf9" surfaceY={-160} />
      <LightVeil id="s9veil" lights={[[960, 500, 540]]} o={0.36} />
      <g filter="url(#rimBlue)">
        <path d="M -300 840 Q 200 760 700 700 L 760 900 Q 200 960 -300 1060 Z" fill={PIP.limb} stroke={PIP.line} strokeWidth={12} />
        <path d="M 640 620 Q 830 600 1000 660 L 960 900 Q 780 940 660 890 Z" fill="#1E2838" stroke="#0A1422" strokeWidth={10} />
        <rect x={700} y={650} width={230} height={190} rx={34} fill="#101A2A" stroke="#3E5C6C" strokeWidth={8} />
      </g>
      <DialSmall x={815} y={745} value={value} r={68} />
      <text x={1240} y={430} fontFamily="monospace" fontSize={44} fill={CYAN} letterSpacing={6} opacity={0.8}>BREATH</text>
      <Bubbles x={1150} y={900} t={t + 33} seed={17} n={9} scale={0.8} />
    </g>
  );
};

export const S10: React.FC<ShotProps> = ({ t }) => (
  <g transform={`translate(960 540) scale(${kf(t, [[0, 1], [90, 1.04]])}) translate(-960 -540)`}>
    <Schematic t={t} id="sch10" />
    <SchLabel x={960} y={130} t={t - 2} text="ONE LITER OF WATER" size={50} />
    <g transform="translate(620 260)">
      <DrawOn d="M 0 0 L 0 420 Q 0 500 80 500 L 360 500 Q 440 500 440 420 L 440 0" t={t - 6} dur={12} width={8} />
      <DrawOn d="M -30 0 L 470 0" t={t - 4} dur={8} width={10} />
      <path d="M 30 300 Q 180 274 410 300 L 410 420 Q 410 470 350 470 L 90 470 Q 30 470 30 420 Z" fill="#2E6B8C" opacity={0.5} />
      {Array.from({ length: 9 }).map((_, i) => (
        <g key={i}>
          <circle cx={90 + (i % 3) * 128 + Math.sin(t / 12 + i) * 6} cy={350 + Math.floor(i / 3) * 52 + Math.cos(t / 10 + i) * 5} r={13} fill={CYAN} opacity={0.85} style={{ filter: `drop-shadow(0 0 8px ${CYAN})` }} />
          <circle cx={85 + (i % 3) * 128} cy={345 + Math.floor(i / 3) * 52} r={4} fill="#FFFFFF" />
        </g>
      ))}
    </g>
    <Arrow x0={1100} y0={500} x1={1260} y1={500} t={t - 20} />
    <SchLabel x={1490} y={470} t={t - 26} text="9 mg" size={92} color={SCH.live} />
    <SchLabel x={1490} y={540} t={t - 30} text="DISSOLVED O₂" size={36} color={SCH.dim} />
  </g>
);

export const S11: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={`translate(960 540) scale(${kf(t, [[0, 1], [len, 1.06]])}) translate(-960 -540)`}>
    <Schematic t={t + 42} id="sch11" />
    <circle cx={960} cy={470} r={310} fill="#1B4D68" stroke={SCH.line} strokeWidth={8} opacity={0.92} />
    <circle cx={960} cy={470} r={280} fill="#2D7E92" opacity={0.55} />
    {Array.from({ length: 9 }).map((_, i) => {
      const a = i * 2.4 + t / 40;
      const d = 40 + (i % 4) * 58;
      return (
        <g key={i}>
          <circle cx={960 + Math.cos(a) * d} cy={470 + Math.sin(a) * d * 0.8} r={18} fill={CYAN} opacity={0.9} style={{ filter: `drop-shadow(0 0 10px ${CYAN})` }} />
          <circle cx={954 + Math.cos(a) * d} cy={464 + Math.sin(a) * d * 0.8} r={6} fill="#FFFFFF" />
        </g>
      );
    })}
    <path d="M 620 470 Q 960 130 1300 470" stroke="#DFF9FF" strokeWidth={5} fill="none" opacity={0.5} />
    <SchLabel x={960} y={835} t={t - 6} text="9 mg O₂ PER LITER" size={54} color={SCH.live} />
    <SchLabel x={960} y={900} t={t - 16} text="AIR-SATURATED FRESH WATER, 20 °C" size={30} color={SCH.dim} />
  </g>
);

export const S12: React.FC<ShotProps> = ({ t }) => {
  const v = 40 * easeOut(clamp((t - 12) / 58));
  const read = String(Math.round(v)).padStart(2, '0');
  return (
    <g>
      <Schematic t={t + 70} id="sch12" />
      <SchLabel x={520} y={140} t={t - 2} text="RESTING BODY" size={44} />
      <g transform="translate(500 520)" stroke={SCH.line} strokeWidth={7} fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${SCH.glow})` }}>
        <DrawOn d="M -30 -90 Q -170 -120 -180 10 Q -190 130 -60 120 Q -10 100 0 30" t={t - 6} dur={12} />
        <DrawOn d="M 30 -90 Q 170 -120 180 10 Q 190 130 60 120 Q 10 100 0 30" t={t - 8} dur={12} />
        <DrawOn d="M 0 -70 L 0 140" t={t - 12} dur={10} />
        <DrawOn d="M 0 -70 Q -50 -170 -110 -190 M 0 -70 Q 50 -170 110 -190" t={t - 16} dur={10} width={5} />
      </g>
      <SchLabel x={500} y={790} t={t - 20} text="250 mL O₂ / MIN" size={48} color={SCH.live} />
      <Arrow x0={760} y0={520} x1={1000} y1={520} t={t - 26} />
      <SchLabel x={1500} y={160} t={t - 4} text="PERFECT GILLS" size={44} />
      <Dial x={1500} y={500} r={210} p={v / 40} readout={read} size={116} />
      <SchLabel x={1500} y={790} t={t - 30} text="LITERS OF WATER / MIN" size={42} color={SCH.live} />
      <SchLabel x={1500} y={860} t={t - 46} text="AT 9 mg O₂ PER LITER" size={32} color={SCH.dim} />
    </g>
  );
};

export const S13: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 6.6 * (1 + 0.04 * clamp(t / len));
  const head = { x: 960, y: 720 };
  const pose: Pose = { ...basePose, x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: 0.14, look: 0.2, armL: { a: 14, b: -6 }, armR: { a: 14, b: -6 }, ...faceAt(t, [[0, 'worried']]) };
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-600 -540) scale(1.9)">
          <Reef t={t + 300} id="rf13" surfaceY={-110} dark={0.4} />
        </g>
      </g>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#061426" opacity={0.28} />
      <Hero look={PIP} pose={pose} rimId="rimBlue" shadow={0} />
      <Gills pose={pose} on={0.45 + 0.55 * (Math.floor(t / 2) % 2)} />
      <Bubbles x={1120} y={910} t={t + 90} seed={21} n={7} scale={1.1} />
    </g>
  );
};

export const S14: React.FC<ShotProps> = ({ t, len }) => {
  const dark = clamp((t - 4) / 34);
  const pose: Pose = { ...basePose, x: 900, y: 700, scale: 1.05, yaw: -0.12, look: -0.45, spin: 0, armL: { a: 32, b: 40 }, armR: { a: 32, b: 40 }, legL: { a: 20, b: -30 }, legR: { a: -16, b: -30 }, sway: 8, ...faceAt(t, [[0, 'worried'], [24, 'shock']]) };
  return (
    <g transform={camT(kf(t, [[0, 960], [len, 930]]), kf(t, [[0, 560], [len, 540]]), kf(t, [[0, 1], [len, 1.14]]))}>
      <Reef t={t + 350} id="rf14" surfaceY={60} dark={dark * 0.9} />
      <g opacity={0.35 + dark * 0.5}>
        <path d={`M ${1500 + Math.sin(t / 30) * 90} 470 Q 1700 360 1960 440 Q 2100 480 2240 430 Q 2140 560 1940 560 Q 1740 600 ${1500 + Math.sin(t / 30) * 90} 470 Z`} fill="#051321" />
        <path d={`M 1880 470 L 2180 330 L 2120 500 Z`} fill="#051321" />
        <path d="M 1830 520 L 1880 650 L 1940 530 Z" fill="#051321" />
        <circle cx={1680} cy={470} r={7} fill="#FF5A4A" opacity={0.5 + 0.5 * Math.sin(t / 4)} />
      </g>
      <Hero look={PIP} pose={pose} rimId="rimBlue" shadow={0} />
      <Gills pose={pose} on={0.4 + 0.6 * (Math.floor(t / 2) % 2)} />
      <Bubbles x={900} y={480} t={t + 20} seed={25} n={12} scale={0.9} />
      <DialSmall x={1710} y={190} value={0} r={62} />
      <Foreground blur={10}>
        <path d="M -100 1080 Q 200 820 340 760 Q 260 940 300 1080 Z" fill="#050F1E" />
      </Foreground>
    </g>
  );
};
