import React from 'react';
import { rnd } from '../anim';
import { Glow } from '../light';

export const Fish: React.FC<{ x: number; y: number; s?: number; dir?: number; t: number; seed?: number; color?: string }> = ({ x, y, s = 1, dir = 1, t, seed = 1, color = '#B9D8D0' }) => {
  const flick = Math.sin(t / 3.2 + seed) * 10;
  return (
    <g transform={`translate(${x} ${y}) scale(${dir * s} ${s})`}>
      <path d={`M -26 0 L -58 ${-18 + flick} L -50 0 L -58 ${18 + flick} Z`} fill={color} stroke="#18303A" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M -30 0 Q 0 -24 34 0 Q 0 22 -30 0 Z" fill={color} stroke="#18303A" strokeWidth={2.5} />
      <path d="M -4 -18 L 8 -32 L 12 -14 Z" fill={color} stroke="#18303A" strokeWidth={2} />
      <circle cx={22} cy={-4} r={3.6} fill="#14242E" />
      <path d="M -16 2 Q 0 12 18 2" stroke="#6E9C9A" strokeWidth={2.5} fill="none" opacity={0.6} />
    </g>
  );
};

export const Bubbles: React.FC<{ x: number; y: number; t: number; seed?: number; n?: number; scale?: number }> = ({ x, y, t, seed = 1, n = 12, scale = 1 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const speed = 0.9 + rnd(seed + 4, i) * 1.4;
      const travel = ((t * speed + rnd(seed, i) * 420) % 460);
      const r = (2.5 + rnd(seed + 1, i) * 7) * scale;
      const bx = x + (rnd(seed + 2, i) - 0.5) * 70 * scale + Math.sin(t / 12 + i) * 8 * scale;
      return (
        <g key={i} opacity={0.75 * (1 - travel / 500)}>
          <circle cx={bx} cy={y - travel} r={r} fill="#BFF3FF" opacity={0.12} />
          <circle cx={bx} cy={y - travel} r={r} fill="none" stroke="#DFF9FF" strokeWidth={1.5 * scale} opacity={0.8} />
          <circle cx={bx - r * 0.3} cy={y - travel - r * 0.35} r={r * 0.22} fill="#FFFFFF" opacity={0.8} />
        </g>
      );
    })}
  </g>
);

const Weed: React.FC<{ x: number; y: number; h: number; t: number; seed: number; c?: string }> = ({ x, y, h, t, seed, c = '#3E7A68' }) => (
  <g stroke={c} strokeWidth={7} strokeLinecap="round" fill="none">
    {[0, 1, 2].map((i) => {
      const sw = Math.sin(t / 26 + seed + i * 0.7) * 16;
      const ox = (i - 1) * 15;
      return <path key={i} d={`M ${x + ox} ${y} Q ${x + ox + sw} ${y - h * 0.55} ${x + ox + sw * 1.7} ${y - h}`} />;
    })}
  </g>
);

const Coral: React.FC<{ x: number; y: number; c: string; s: number; seed: number }> = ({ x, y, c, s, seed }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={c} strokeWidth={9} strokeLinecap="round" fill="none">
    <path d="M 0 0 L 0 -70 M 0 -40 L -34 -74 M 0 -52 L 32 -92 M -34 -74 L -44 -104 M 32 -92 L 48 -118 M 0 -70 L 8 -108" />
    {[0, 1, 2, 3].map((i) => <circle key={i} cx={-44 + rnd(seed + i, 3) * 92} cy={-104 + rnd(seed + i, 7) * 28} r={6} fill={c} stroke="none" />)}
  </g>
);

export const Reef: React.FC<{ t: number; id?: string; dark?: number; surfaceY?: number; sunX?: number }> = ({ t, id = 'reef', dark = 0, surfaceY = 100, sunX = 1150 }) => {
  const shimmer = (x: number, i: number) => surfaceY + Math.sin(t / 14 + x / 130 + i) * 9;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}water`} x1="0" y1="0" x2="0" y2="1250" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2D7E92" />
          <stop offset="32%" stopColor="#1B5674" />
          <stop offset="72%" stopColor="#123650" />
          <stop offset="100%" stopColor="#0A1D32" />
        </linearGradient>
        <linearGradient id={`${id}sand`} x1="0" y1="860" x2="0" y2="1400" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7B8B79" />
          <stop offset="100%" stopColor="#354C4A" />
        </linearGradient>
      </defs>
      <rect x={-400} y={-400} width={2720} height={1900} fill={`url(#${id}water)`} />
      {dark < 0.8 ? <circle cx={sunX} cy={surfaceY - 40} r={430} fill="url(#kitBloom)" opacity={0.5 * (1 - dark)} style={{ mixBlendMode: 'screen' }} /> : null}
      {dark < 0.95 ? <circle cx={sunX} cy={surfaceY - 34} r={54} fill="#FFE7B3" opacity={0.85 * (1 - dark)} /> : null}
      {dark < 0.8 ? Array.from({ length: 10 }).map((_, i) => {
        const x0 = 140 + i * 230 + Math.sin(t / 40 + i) * 26;
        const w = 46 + rnd(41, i) * 60;
        return <path key={i} d={`M ${x0} ${surfaceY} L ${x0 + w} ${surfaceY} L ${x0 + w * 2.6 + 90} 1180 L ${x0 - w * 0.7} 1180 Z`} fill="url(#kitShaft)" opacity={(0.55 - (i % 3) * 0.12) * (1 - dark * 0.95)} style={{ mixBlendMode: 'screen' }} />;
      }) : null}
      <path d={`M -400 ${surfaceY} Q -200 ${surfaceY - 22} 0 ${surfaceY + 4} T 400 ${surfaceY} T 800 ${surfaceY + 6} T 1200 ${surfaceY - 2} T 1600 ${surfaceY + 4} T 2000 ${surfaceY} T 2400 ${surfaceY + 5}`} stroke="#DFF9FF" strokeWidth={10} fill="none" opacity={0.75 * (1 - dark)} />
      {Array.from({ length: 28 }).map((_, i) => {
        const x = -200 + i * 90;
        return <path key={i} d={`M ${x} ${shimmer(x, i)} Q ${x + 28} ${shimmer(x, i) - 9} ${x + 62} ${shimmer(x, i)}`} stroke="#DFF9FF" strokeWidth={4} fill="none" opacity={0.35 * (1 - dark)} />;
      })}
      {[[560, 450, 1], [640, 520, 0.75], [1520, 320, 0.8], [1600, 470, 0.9], [1750, 390, 0.65], [410, 700, 0.7], [1330, 620, 0.6]].map(([x, y, s], i) => (
        <Fish key={i} x={x + Math.sin(t / 34 + i) * 26} y={y + Math.cos(t / 28 + i) * 10} s={s} dir={i % 2 ? -1 : 1} t={t} seed={i + 3} color={i % 3 ? '#B9D8D0' : '#E9C46A'} />
      ))}
      <path d="M -400 880 Q 200 820 960 878 Q 1580 822 2320 890 L 2320 1600 L -400 1600 Z" fill={`url(#${id}sand)`} />
      {Array.from({ length: 16 }).map((_, i) => {
        const y = 900 + i * i * 2.7;
        return <path key={i} d={`M ${-400 + i * 22} ${y + 30} Q 960 ${y - 26} ${2320 - i * 22} ${y + 30}`} stroke="#A6B39A" strokeWidth={3} fill="none" opacity={0.18 + rnd(51, i) * 0.16} />;
      })}
      {[[250, 930], [430, 890], [770, 920], [1180, 880], [1510, 930], [1760, 900]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + 8} rx={40 + i * 4} ry={11} fill="#0A1D32" opacity={0.4} />
          <path d={`M ${x - 44} ${y} Q ${x - 24} ${y - 34 - i * 2} ${x + 6} ${y - 22} Q ${x + 36} ${y - 30} ${x + 50} ${y} Z`} fill={i % 2 ? '#4E6061' : '#3C5558'} />
          <path d={`M ${x - 22} ${y - 26} Q ${x + 4} ${y - 40} ${x + 28} ${y - 26}`} stroke="#8FA89B" strokeWidth={3} fill="none" opacity={0.55} />
        </g>
      ))}
      <Coral x={320} y={970} c="#C9666B" s={1.25} seed={4} />
      <Coral x={620} y={1030} c="#D68B54" s={0.9} seed={9} />
      <Coral x={1390} y={1010} c="#B66E9C" s={1.1} seed={13} />
      <Coral x={1820} y={1060} c="#C9666B" s={0.85} seed={17} />
      <Weed x={480} y={960} h={210} t={t} seed={2} />
      <Weed x={900} y={930} h={160} t={t} seed={7} c="#4F8A71" />
      <Weed x={1290} y={950} h={230} t={t} seed={11} />
      <Weed x={1690} y={990} h={180} t={t} seed={19} c="#4F8A71" />
      {[[1080, 980], [1530, 1030], [700, 1050], [1900, 970]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${i * 37})`} fill={i % 2 ? '#E6D2AE' : '#C98E68'} stroke="#5C6A60" strokeWidth={2.5}>
          <path d="M -34 0 Q 0 -34 34 0 Q 0 18 -34 0 Z" />
          <path d="M -18 -4 L 0 -18 L 18 -4 M -8 8 L 8 8" stroke="#8B9B8A" fill="none" />
        </g>
      ))}
      <g transform="translate(1740 990) rotate(-18)" stroke="#34424A" strokeWidth={12} fill="none" strokeLinecap="round">
        <path d="M 0 -150 L 0 40" />
        <path d="M -46 -106 Q 0 -178 46 -106" />
        <path d="M -58 40 Q 0 76 58 40" strokeWidth={18} />
      </g>
      <g transform="translate(400 1010) rotate(24)" opacity={0.9}>
        <rect x={-30} y={-58} width={60} height={108} rx={14} fill="#4E8D82" opacity={0.75} />
        <rect x={-22} y={-38} width={44} height={52} fill="#B9D8D0" opacity={0.35} />
        <rect x={-22} y={34} width={44} height={12} fill="#D8C79A" />
      </g>
      <g transform="translate(1040 1020) rotate(12)" fill="#D68B54" stroke="#8A5A3A" strokeWidth={3}>
        <path d="M 0 -38 L 11 -11 L 40 -9 L 18 10 L 25 38 L 0 22 L -25 38 L -18 10 L -40 -9 L -11 -11 Z" />
      </g>
      <Bubbles x={sunX - 300} y={720} t={t} seed={3} n={12} scale={1.2} />
      <Bubbles x={820} y={880} t={t + 30} seed={12} n={9} scale={0.9} />
      <Bubbles x={1500} y={830} t={t + 70} seed={23} n={10} scale={1} />
      {Array.from({ length: 34 }).map((_, i) => (
        <circle key={i} cx={-200 + rnd(71, i) * 2300} cy={120 + rnd(72, i) * 940} r={1 + rnd(73, i) * 2.6} fill="#DFF9FF" opacity={0.2 + rnd(74, i) * 0.35} />
      ))}
      {dark < 0.8 ? <Glow x={sunX} y={surfaceY + 220} r={780} kind="cool" o={0.2 * (1 - dark)} /> : null}
      {dark > 0 ? <rect x={-400} y={-400} width={2720} height={1900} fill="#060F22" opacity={0.62 * dark} /> : null}
    </g>
  );
};
