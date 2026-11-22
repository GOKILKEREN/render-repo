import React from 'react';
import { rnd } from '../anim';
import { DuskSky, Sun } from '../kit';
import { Glow } from '../light';

export const Shore: React.FC<{ t: number; id?: string; sunX?: number; sunY?: number }> = ({ t, id = 'shore', sunX = 1310, sunY = 520 }) => {
  const surf = (x: number, i: number) => 748 + Math.sin(t / 16 + x / 150 + i) * 6;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}water`} x1="0" y1="740" x2="0" y2="1080" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7A5277" />
          <stop offset="35%" stopColor="#3D3C6B" />
          <stop offset="100%" stopColor="#122642" />
        </linearGradient>
        <linearGradient id={`${id}sand`} x1="0" y1="930" x2="0" y2="1080" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6B4D55" />
          <stop offset="100%" stopColor="#3A2B38" />
        </linearGradient>
      </defs>
      <DuskSky id={`${id}sky`} horizonY={750} />
      <g filter="url(#blur6)">
        {[[300, 250, 320, 24], [830, 190, 260, 18], [1560, 300, 380, 26], [1180, 390, 240, 16]].map(([cx, cy, rx, ry], i) => (
          <g key={i} transform={`translate(${Math.sin(t / 90 + i) * 16} 0)`}>
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#5B3970" opacity={0.65} />
            <ellipse cx={cx + 8} cy={cy + ry * 0.55} rx={rx * 0.9} ry={ry * 0.5} fill="#EF9A6C" opacity={0.6} />
          </g>
        ))}
      </g>
      <Sun x={sunX} y={sunY} r={128} t={t} />
      {[0, 1, 2].map((i) => {
        const bx = ((120 + t * (1.2 + i * 0.3) + i * 640) % 2140) - 110;
        const by = 210 + i * 44 + Math.sin(t / 20 + i) * 8;
        return <path key={i} d={`M ${bx - 13} ${by} Q ${bx - 6} ${by - 7} ${bx} ${by - 1} Q ${bx + 6} ${by - 7} ${bx + 13} ${by}`} stroke="#2B1C38" strokeWidth={3.5} fill="none" />;
      })}
      <path d="M -400 750 Q 90 640 480 748 L 480 780 L -400 780 Z" fill="#372B4F" />
      <path d="M 1420 748 Q 1720 650 2320 744 L 2320 780 L 1420 780 Z" fill="#2E2648" />
      {[[620, 690], [1660, 700]].map(([bx, by], i) => (
        <g key={i} stroke="#2A233F" strokeWidth={4} fill="#3B3050">
          <path d={`M ${bx - 30} ${by} L ${bx} ${by - 100} L ${bx} ${by} Z`} />
          <path d={`M ${bx + 8} ${by} L ${bx + 8} ${by - 76} L ${bx + 40} ${by} Z`} />
        </g>
      ))}
      <rect x={-400} y={740} width={2720} height={360} fill={`url(#${id}water)`} />
      <rect x={-400} y={738} width={2720} height={5} fill="#FFD7A0" opacity={0.65} />
      {Array.from({ length: 18 }).map((_, i) => {
        const x = -200 + i * 130;
        const w = 40 + rnd(11, i) * 90;
        return <path key={i} d={`M ${x} ${surf(x, i)} Q ${x + w / 2} ${surf(x, i) - 5} ${x + w} ${surf(x, i)}`} stroke={i % 3 ? '#C49AB4' : '#FFD2A2'} strokeWidth={3} fill="none" opacity={i % 3 ? 0.35 : 0.6} />;
      })}
      {Array.from({ length: 22 }).map((_, i) => {
        const y = 770 + rnd(21, i) * 250;
        const x = sunX + (rnd(22, i) - 0.5) * (120 + (y - 740) * 1.5);
        return <rect key={i} x={x} y={y} width={12 + rnd(23, i) * 46} height={3 + rnd(24, i) * 4} rx={3} fill="#FFC48A" opacity={0.1 + rnd(25, i) * 0.3} />;
      })}
      <path d="M -400 930 Q 420 900 960 938 Q 1480 902 2320 940 L 2320 1500 L -400 1500 Z" fill={`url(#${id}sand)`} />
      <path d="M -400 934 Q 420 904 960 942 Q 1480 906 2320 944" stroke="#FFD7A0" strokeWidth={4} fill="none" opacity={0.4} />
      {Array.from({ length: 34 }).map((_, i) => (
        <ellipse key={i} cx={-300 + rnd(31, i) * 2520} cy={950 + rnd(32, i) * 190} rx={2 + rnd(33, i) * 5} ry={1 + rnd(34, i) * 2.5} fill={i % 4 ? '#8B6B62' : '#D7B48C'} opacity={0.5} />
      ))}
      {[[300, 1010], [520, 970], [1520, 985], [1800, 1030]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + 5} rx={28} ry={9} fill="#201724" opacity={0.5} />
          <path d={`M ${x - 30} ${y} Q ${x - 12} ${y - 24 - i * 3} ${x + 4} ${y} Q ${x + 18} ${y - 16} ${x + 30} ${y} Z`} fill="#5B4A50" />
        </g>
      ))}
      <g transform="rotate(-8 250 1030)">
        <rect x={90} y={990} width={310} height={80} rx={10} fill="#B96A5F" />
        <rect x={90} y={1010} width={310} height={14} fill="#E9C46A" opacity={0.75} />
        <rect x={90} y={1046} width={310} height={10} fill="#E9C46A" opacity={0.5} />
      </g>
      <g>
        <path d="M 1690 1010 L 1690 760" stroke="#2C2230" strokeWidth={8} />
        <path d="M 1580 770 Q 1690 690 1800 770 L 1690 790 Z" fill="#C9605A" />
        <path d="M 1580 770 Q 1690 690 1800 770" stroke="#F6C58C" strokeWidth={4} fill="none" opacity={0.7} />
        <ellipse cx={1690} cy={1015} rx={44} ry={12} fill="#201724" opacity={0.45} />
      </g>
      <g>
        <ellipse cx={1400} cy={1020} rx={52} ry={14} fill="#201724" opacity={0.45} />
        <rect x={1350} y={960} width={100} height={62} rx={12} fill="#43657A" />
        <path d="M 1350 980 L 1450 980" stroke="#8FB6C4" strokeWidth={5} />
        <path d="M 1370 960 Q 1380 920 1420 922" stroke="#2C2230" strokeWidth={5} fill="none" />
      </g>
      <g>
        <circle cx={1250} cy={1000} r={42} fill="#D9534F" />
        <path d="M 1210 1000 Q 1250 966 1290 1000 M 1250 958 Q 1286 1000 1250 1042" stroke="#F6EFE3" strokeWidth={7} fill="none" opacity={0.85} />
        <ellipse cx={1250} cy={1044} rx={40} ry={9} fill="#201724" opacity={0.4} />
      </g>
      {[[440, 1040], [490, 1050]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${i ? 8 : -10})`}>
          <ellipse cx={0} cy={6} rx={40} ry={10} fill="#201724" opacity={0.4} />
          <path d="M -34 0 Q 0 -22 30 0 Q 0 16 -34 0 Z" fill="#3A3446" />
          <path d="M -24 -4 Q -8 -12 12 -4" stroke="#E9C46A" strokeWidth={4} fill="none" />
        </g>
      ))}
      <g transform="translate(930 1035)">
        <ellipse cx={0} cy={10} rx={48} ry={12} fill="#201724" opacity={0.4} />
        <path d="M -34 -40 L 34 -40 L 26 8 L -26 8 Z" fill="#4E7385" />
        <path d="M -30 -40 Q 0 -64 30 -40" stroke="#B8DCE6" strokeWidth={6} fill="none" />
        <path d="M 44 -46 L 66 16" stroke="#8A6B52" strokeWidth={6} strokeLinecap="round" />
      </g>
      <Glow x={sunX} y={sunY + 70} r={520} kind="warm" o={0.28} />
    </g>
  );
};
