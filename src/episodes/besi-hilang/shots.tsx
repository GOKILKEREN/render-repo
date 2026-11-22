import React from 'react';
import type { ShotMap as EngineShotMap, ShotProps } from '../../engine/episode';
import { FONT } from '../../engine/fonts';
import { SHOT_SPEC } from './shotSpec';

const W = 1080;
const H = 1920;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

const Backdrop: React.FC<{ p: number; seed: number; mode?: 'room' | 'city' | 'lab' | 'ruin' }> = ({ p, seed, mode = 'city' }) => {
  const lab = mode === 'lab';
  const room = mode === 'room';
  const ruin = mode === 'ruin';
  const dust = Array.from({ length: 18 }, (_, i) => ({
    x: 120 + ((i * 173 + seed * 47) % 840),
    y: 260 + ((i * 311 + seed * 89) % 1260),
    r: 2 + (i % 3),
    d: Math.sin(p * 12 + i + seed) * 10,
  }));
  return (
    <>
      <defs>
        <linearGradient id="bhSky" x1={0} y1={0} x2={0.3} y2={1}>
          <stop offset="0%" stopColor={lab ? '#0A1020' : ruin ? '#241327' : '#241038'} />
          <stop offset="55%" stopColor={lab ? '#18233A' : ruin ? '#4A1F2D' : '#6E2C48'} />
          <stop offset="100%" stopColor={lab ? '#35405A' : '#D56A35'} />
        </linearGradient>
        <radialGradient id="bhSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD8A6" stopOpacity={0.95} />
          <stop offset="45%" stopColor="#FF9B4A" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#FF6B2C" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="bhGround" x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0%" stopColor="#22162F" />
          <stop offset="100%" stopColor="#0B0916" />
        </linearGradient>
        <filter id="bhBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      <rect width={W} height={H} fill="url(#bhSky)" />
      <circle cx={room ? 820 : 540} cy={room ? 250 : 320} r={room ? 210 : 260} fill="url(#bhSun)" />
      {!lab ? <circle cx={room ? 820 : 540} cy={room ? 250 : 320} r={76} fill="#FFD3A0" opacity={0.9} /> : null}
      {room ? (
        <g>
          <rect x={150} y={420} width={300} height={360} rx={12} fill="#0B0A18" stroke="#FFB15C" strokeWidth={6} />
          <rect x={170} y={440} width={260} height={320} fill="#FFB15C" opacity={0.28} />
          <path d="M300 430 L300 770 M160 600 L440 600" stroke="#0B0A18" strokeWidth={10} />
          <path d="M540 250 L540 520" stroke="#0B0A18" strokeWidth={8} />
          <path d="M450 520 L630 520 L600 580 L480 580 Z" fill="#1A1228" stroke="#FFB15C" strokeWidth={5} />
          <circle cx={540} cy={585} r={42} fill="#FFC27A" filter="url(#bhBlur)" opacity={0.8} />
        </g>
      ) : (
        <g opacity={ruin ? 0.95 : 0.75}>
          {Array.from({ length: 11 }, (_, i) => {
            const x = i * 105 - 20 + ((seed * 13) % 37);
            const h = 180 + ((i * 97 + seed * 31) % 360);
            const tilt = ruin ? Math.sin(i + seed) * 9 : 0;
            return (
              <g key={i} transform={`rotate(${tilt} ${x + 50} 1160)`}>
                <rect x={x} y={1160 - h} width={92} height={h} fill="#120C22" />
                {Array.from({ length: 4 }, (_, j) => (
                  <rect key={j} x={x + 14} y={1180 - h + j * 60} width={18} height={24} fill="#FFB15C" opacity={0.22 + ((i + j + seed) % 3) * 0.16} />
                ))}
              </g>
            );
          })}
        </g>
      )}
      <rect y={1160} width={W} height={760} fill="url(#bhGround)" />
      <path d="M0 1160 Q540 1110 1080 1160" fill="none" stroke="#FFAF62" strokeWidth={4} opacity={0.35} />
      <g fill="#FFD7A8" opacity={0.35}>
        {dust.map((d, i) => (
          <circle key={i} cx={d.x + d.d} cy={d.y + d.d * 0.4} r={d.r} />
        ))}
      </g>
    </>
  );
};

const SafeText: React.FC<{
  y: number;
  size?: number;
  fill?: string;
  font?: string;
  weight?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({ y, size = 64, fill = '#FFF3E2', font = FONT.title, weight = 800, opacity = 1, children }) => (
  <text x={540} y={y} textAnchor="middle" fontFamily={font} fontSize={size} fontWeight={weight} fill={fill} opacity={opacity}>
    {children}
  </text>
);

const Stick: React.FC<{ x: number; y: number; s?: number; flip?: boolean; sad?: boolean; lean?: number; color?: string }> = ({ x, y, s = 1, flip = false, sad = false, lean = 0, color = '#17122A' }) => {
  const k = flip ? -s : s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${lean}) scale(${k} ${s})`}>
      <g stroke="#FF9A4D" strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.6} transform="translate(-5 -4)">
        <path d="M0 -96 L0 18 M-52 -50 L0 -76 L52 -44 M-30 18 L-52 110 M30 18 L58 108" />
      </g>
      <g stroke={color} strokeWidth={12} strokeLinecap="round" fill="none">
        <path d="M0 -96 L0 18 M-52 -50 L0 -76 L52 -44 M-30 18 L-52 110 M30 18 L58 108" />
      </g>
      <circle cx={0} cy="-130" r={30} fill={color} stroke="#FF9A4D" strokeWidth={5} />
      {sad ? <path d="M-17 -132 Q-8 -140 0 -132 Q8 -140 17 -132" stroke="#FFD3A0" strokeWidth={4} fill="none" /> : <circle cx="-8" cy="-136" r={3} fill="#FFD3A0" />}
    </g>
  );
};

const pop = (p: number) => {
  if (p < 0.14) return mix(0.42, 1.14, p / 0.14);
  if (p < 0.3) return mix(1.14, 1, (p - 0.14) / 0.16);
  return 1 + Math.sin(p * 18) * 0.006;
};

const DayCard: React.FC<{ day: number; p: number; seed: number }> = ({ day, p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    <g transform={`translate(540 470) scale(${pop(p)}) translate(-540 -470)`}>
      <rect x={200} y={300} width={680} height={400} rx={34} fill="#100B20" opacity={0.88} stroke="#FFB15C" strokeWidth={5} />
      <SafeText y={465} size={150}>DAY {day}</SafeText>
      <SafeText y={555} size={40} fill="#FFB15C" font={FONT.ui}>BESI MENGHILANG</SafeText>
    </g>
    <SafeText y={1580} size={38} fill="#FFD8AE" font={FONT.ui} opacity={0.9}>HARI KE-{day}</SafeText>
  </>
);

const HookTitle: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <g transform={`translate(540 460) scale(${pop(p)}) translate(-540 -460)`}>
      <SafeText y={420} size={88}>Hari ini besi</SafeText>
      <SafeText y={530} size={88}>menghilang.</SafeText>
    </g>
    <SafeText y={1580} size={36} fill="#FFB15C" font={FONT.ui}>YANG TINGGAL: NGGAK ADA</SafeText>
  </>
);

const PhoneScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => {
  const drip = Math.sin(p * Math.PI) * 260;
  return (
    <>
      <Backdrop p={p} seed={seed} mode="room" />
      <g transform={`translate(0 ${Math.sin(p * 8 + seed) * 4})`}>
        <rect x={420} y={620} width={240} height={430} rx={38} fill="#171229" stroke="#FFB15C" strokeWidth={6} />
        <rect x={444} y={670} width={192} height={300} rx={8} fill="#3B2A50" />
        <path d={`M540 1050 Q510 ${1120 + drip} 540 ${1270 + drip} Q570 ${1120 + drip} 540 1050`} fill="#FF7A32" />
        <circle cx={540} cy={1280 + drip} r={18 + p * 12} fill="#FFD27A" />
      </g>
      <Stick x={250} y={1500} s={1.1} />
      <SafeText y={1630} size={34} fill="#FFB15C" font={FONT.ui}>HP JADI LOGAM CAIR</SafeText>
    </>
  );
};

const MoltenScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <ellipse cx={540} cy={980} rx={250 + p * 40} ry={180} fill="#FF7A32" opacity={0.85} />
    <ellipse cx={540} cy={940} rx={180} ry={120} fill="#FFD27A" opacity={0.6 + p * 0.25} />
    <path d={`M420 940 Q540 ${780 + Math.sin(p * 9 + seed) * 30} 660 940`} fill="none" stroke="#FFF0C6" strokeWidth={12} opacity={0.8} />
    {Array.from({ length: 9 }, (_, i) => (
      <circle key={i} cx={360 + i * 45} cy={1180 + Math.sin(p * 12 + i) * 24} r={7 + (i % 3) * 4} fill="#FFD27A" />
    ))}
    <SafeText y={1550} size={52} fill="#FFF3E2">LELEH.</SafeText>
  </>
);

const HandScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => {
  const drop = p * p * 700;
  const rot = p * 220;
  return (
    <>
      <Backdrop p={p} seed={seed} mode="room" />
      <g transform={`translate(760 520) rotate(-28)`}>
        <path d="M-90 0 Q0 -60 110 20 L80 90 Q-20 40 -90 0" fill="#2A1E3C" stroke="#FF9A4D" strokeWidth={5} />
      </g>
      <g transform={`translate(${540 + Math.sin(p * 6 + seed) * 30} ${620 + drop}) rotate(${rot})`}>
        <rect x="-80" y="-150" width={160} height={300} rx={28} fill="#171229" stroke="#FFB15C" strokeWidth={6} />
        <rect x="-60" y="-120" width={120} height={230} rx={6} fill="#3B2A50" />
      </g>
      <SafeText y={1600} size={36} fill="#FFB15C" font={FONT.ui}>NGOAK, HILANG</SafeText>
    </>
  );
};

const PanicScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="city" />
    {Array.from({ length: 5 }, (_, i) => (
      <Stick key={i} x={180 + i * 180 + Math.sin(p * 10 + i + seed) * 26} y={1420 + (i % 2) * 70} s={0.95 + (i % 3) * 0.08} flip={i % 2 === 0} lean={Math.sin(p * 8 + i) * 8} />
    ))}
    <SafeText y={1610} size={34} fill="#FFB15C" font={FONT.ui}>PANIK, GAS, PANIK</SafeText>
  </>
);

const HandleScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => {
  const fall = p * p * 460;
  return (
    <>
      <Backdrop p={p} seed={seed} mode="room" />
      <rect x={250} y={480} width={580} height={920} rx={18} fill="#1A142C" stroke="#FFB15C" strokeWidth={6} />
      <rect x={620} y={880} width={150} height={26} rx={13} fill="#241A36" />
      <g transform={`translate(${640 + Math.sin(p * 7 + seed) * 40} ${880 + fall}) rotate(${p * 160})`}>
        <rect x="-70" y="-18" width={140} height={36} rx={18} fill="#FFB15C" />
        <rect x="-70" y={4} width={26} height={60} rx={10} fill="#FF9A4D" />
      </g>
      <Stick x={380} y={1450} s={1.05} />
      <SafeText y={1630} size={34} fill="#FFB15C" font={FONT.ui}>GAGANG LEPAS</SafeText>
    </>
  );
};

const CarScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => {
  const sag = Math.sin(p * Math.PI) * 110;
  return (
    <>
      <Backdrop p={p} seed={seed} mode="city" />
      <g transform={`translate(0 ${sag})`}>
        <path d={`M190 1090 Q540 ${780 + sag} 890 1090 L930 1300 Q540 ${1390 + sag} 150 1300 Z`} fill="#211833" stroke="#FFB15C" strokeWidth={6} />
        <circle cx={300} cy={1310} r={70} fill="#100B1E" stroke="#FF9A4D" strokeWidth={5} />
        <circle cx={780} cy={1310} r={70} fill="#100B1E" stroke="#FF9A4D" strokeWidth={5} />
        <path d="M350 960 Q540 850 730 960" fill="none" stroke="#FFD27A" strokeWidth={10} opacity={0.8} />
      </g>
      <SafeText y={1590} size={40} fill="#FFF3E2">LEMBEK, KAYAK ADONAN.</SafeText>
    </>
  );
};

const TrafficScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="city" />
    <g transform={`rotate(${p * 24} 540 1180)`}>
      <rect x={520} y={520} width={40} height={660} fill="#100B1E" stroke="#FF9A4D" strokeWidth={5} />
      <rect x={430} y={420} width={220} height={360} rx={30} fill="#17122A" stroke="#FFB15C" strokeWidth={6} />
      <circle cx={540} cy={510} r={42} fill="#4A211C" />
      <circle cx={540} cy={600} r={42} fill="#4A211C" />
      <circle cx={540} cy={690} r={42} fill="#FF7A32" opacity={0.4 + p * 0.6} />
    </g>
    <SafeText y={1600} size={36} fill="#FFB15C" font={FONT.ui}>LAMPU AMBRUK</SafeText>
  </>
);

const AskScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <g transform={`translate(540 1040) scale(${1.6 + Math.sin(p * Math.PI) * 0.08}) translate(-540 -1040)`}>
      <Stick x={540} y={1350} s={1.5} sad lean={Math.sin(p * 8 + seed) * 5} />
    </g>
    <SafeText y={1580} size={46} fill="#FFF3E2">INI APAAN, BANG?</SafeText>
  </>
);

const PanScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <ellipse cx={540} cy={1200} rx={260} ry={80} fill="#0C0A18" stroke="#FFB15C" strokeWidth={5} />
    <path d="M300 1180 L200 990 M780 1180 L880 990" stroke="#FF9A4D" strokeWidth={12} opacity={1 - p * 0.7} />
    <circle cx={540} cy={1150} r={70 + p * 60} fill="#FFB15C" opacity={0.25 - p * 0.2} filter="url(#bhBlur)" />
    <SafeText y={1580} size={52}>WAJAN? HILANG.</SafeText>
  </>
);

const KnifeScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <rect x={410} y={900} width={260} height={360} rx={18} fill="#17122A" stroke="#FFB15C" strokeWidth={6} />
    {Array.from({ length: 4 }, (_, i) => (
      <rect key={i} x={440 + i * 52} y={860 - ((i + seed) % 2) * 30} width={24} height={180} rx={6} fill="#2B203E" opacity={0.3 + p * 0.2} />
    ))}
    <SafeText y={1580} size={52}>PISAU? HILANG.</SafeText>
  </>
);

const SpoonScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => {
  const bend = Math.sin(p * Math.PI) * 60;
  return (
    <>
      <Backdrop p={p} seed={seed} mode="room" />
      <g transform={`translate(${540 + Math.sin(p * 7 + seed) * 20} 1050) rotate(${bend})`}>
        <rect x="-18" y="-220" width={36} height={300} rx={16} fill="#8C6139" stroke="#FFB15C" strokeWidth={4} />
        <ellipse cx={0} cy="-250" rx={54} ry={74} fill="#A77345" stroke="#FFB15C" strokeWidth={4} />
        <path d="M-10 -80 L40 -10 L10 30" fill="none" stroke="#FFD27A" strokeWidth={6} />
      </g>
      <SafeText y={1580} size={46}>SENDOK KAYU, PATAH.</SafeText>
    </>
  );
};

const HandEatScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <ellipse cx={540} cy={1320} rx={230} ry={80} fill="#100B20" stroke="#FFB15C" strokeWidth={5} />
    <Stick x={540} y={1250} s={1.6} sad flip={false} />
    <g transform={`translate(${420 + Math.sin(p * 9 + seed) * 40} 1080)`}>
      <path d="M0 0 Q60 -40 120 10 Q80 60 0 0" fill="#2A1E3C" stroke="#FF9A4D" strokeWidth={5} />
    </g>
    <SafeText y={1610} size={38} fill="#FFD8AE" font={FONT.ui}>MAKAN PAKAI TANGAN</SafeText>
  </>
);

const CryScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <g transform={`translate(540 1050) scale(${1.5 + Math.sin(p * Math.PI) * 0.05}) translate(-540 -1050)`}>
      <Stick x={540} y={1380} s={1.5} sad flip lean={-6} />
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={i} cx={470 + i * 26} cy={1250 + ((p * 300 + i * 40) % 260)} r={6} fill="#9CC8FF" opacity={0.8} />
      ))}
    </g>
    <SafeText y={1600} size={40}>NANGIS. BERANTAKAN.</SafeText>
  </>
);

const BuildingScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    {Array.from({ length: 4 }, (_, i) => {
      const h = 420 + i * 120;
      const x = 180 + i * 210;
      return (
        <g key={i} transform={`rotate(${(i % 2 ? -1 : 1) * (8 + p * 12)} ${x + 70} 1240)`}>
          <rect x={x} y={1240 - h} width={140} height={h} fill="#17102A" stroke="#FF9A4D" strokeWidth={4} />
          {Array.from({ length: 6 }, (_, j) => (
            <rect key={j} x={x + 20} y={1280 - h + j * 70} width={26} height={28} fill="#FFB15C" opacity={0.25} />
          ))}
        </g>
      );
    })}
    <SafeText y={1600} size={40}>GEDUNG MIRING.</SafeText>
  </>
);

const RailScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    <path d={`M80 1320 Q540 ${1180 + Math.sin(p * 6 + seed) * 50} 1000 1300`} fill="none" stroke="#FFB15C" strokeWidth={14} />
    <path d={`M80 1400 Q540 ${1260 + Math.sin(p * 6 + seed) * 50} 1000 1380`} fill="none" stroke="#5C3A2A" strokeWidth={14} />
    <g transform={`translate(${540 + p * 180} ${1120 + Math.sin(p * 9) * 40}) rotate(${p * 18})`}>
      <rect x="-170" y="-90" width={340} height={150} rx={24} fill="#24183A" stroke="#FF9A4D" strokeWidth={6} />
      <rect x="-120" y="-140" width={240} height={70} rx={18} fill="#3A274F" />
      <circle cx="-100" cy={70} r={28} fill="#0C0A18" />
      <circle cx={100} cy={70} r={28} fill="#0C0A18" />
    </g>
    <SafeText y={1620} size={38} fill="#FFB15C" font={FONT.ui}>KERETA KELUAR JALUR</SafeText>
  </>
);

const BridgeScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    <path d={`M100 1080 Q540 ${1240 + p * 160} 980 1080`} fill="none" stroke="#FFB15C" strokeWidth={18} />
    <path d={`M100 1160 Q540 ${1320 + p * 160} 980 1160`} fill="none" stroke="#6E432E" strokeWidth={10} />
    {Array.from({ length: 7 }, (_, i) => (
      <rect key={i} x={140 + i * 120} y={1160 + Math.sin(i + p * 4 + seed) * p * 90} width={14} height={180} fill="#FF9A4D" opacity={0.7} />
    ))}
    <SafeText y={1620} size={38}>JEMBATAN TINGGAL PUING.</SafeText>
  </>
);

const CityScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    <g opacity={1 - p * 0.8}>
      <path d="M120 760 Q540 900 960 740" fill="none" stroke="#FFB15C" strokeWidth={8} />
      <path d="M140 820 Q540 960 940 800" fill="none" stroke="#FF9A4D" strokeWidth={5} />
    </g>
    {Array.from({ length: 8 }, (_, i) => (
      <circle key={i} cx={150 + i * 110} cy={900 + ((i * 73 + seed * 29) % 180)} r={5 + (i % 3) * 3} fill="#FFD27A" opacity={p * 0.8} />
    ))}
    <SafeText y={1600} size={44}>KOTA GELAP, SINYAL HILANG.</SafeText>
  </>
);

const BloodScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="lab" />
    <g opacity={0.35} stroke="#7FA5C8" strokeWidth={1}>
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${80 + i * 115} 300 L${80 + i * 115} 1350`} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M80 ${300 + i * 130} L1000 ${300 + i * 130}`} />
      ))}
    </g>
    <circle cx={540} cy={820} r={230 + Math.sin(p * 8 + seed) * 8} fill="#5A1F2E" stroke="#FF6B57" strokeWidth={8} />
    <circle cx={540} cy={820} r={90} fill="#120B1C" stroke="#FFB15C" strokeWidth={6} strokeDasharray="12 14" />
    <SafeText y={1500} size={44}>BESI DI DARAH?</SafeText>
    <SafeText y={1580} size={36} fill="#FFB15C" font={FONT.ui}>+/- 2,5 GRAM</SafeText>
  </>
);

const OxygenScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="lab" />
    {Array.from({ length: 7 }, (_, i) => (
      <g key={i} transform={`translate(${420 + Math.sin(p * 7 + i + seed) * 180} ${700 + i * 120 - p * 160})`}>
        <circle cx="-22" cy={0} r={26} fill="#8FD3FF" opacity={0.85} />
        <circle cx={22} cy={0} r={26} fill="#8FD3FF" opacity={0.85} />
        <SafeText y={12} size={28} fill="#0B1424" font={FONT.ui}>O</SafeText>
      </g>
    ))}
    <SafeText y={1560} size={40}>OKSIGEN NGGAK DIANGKUT.</SafeText>
  </>
);

const FaintScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <Stick x={540} y={1260 + p * 180} s={1.8} sad lean={p * 78} />
    <ellipse cx={540} cy={1600} rx={240} ry={46} fill="#0B0916" opacity={0.8} />
    <SafeText y={1660} size={34} fill="#FFB15C" font={FONT.ui}>PINGSAN DI LANTAI</SafeText>
  </>
);

const ScientistScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="lab" />
    <Stick x={540} y={1320} s={1.6} />
    <rect x={620} y={900} width={220} height={300} rx={12} fill="#F3E8D6" stroke="#FFB15C" strokeWidth={5} transform={`rotate(${-6 + Math.sin(p * 6 + seed) * 4} 730 1050)`} />
    <SafeText y={1060} size={34} fill="#1A1228" font={FONT.ui} opacity={1}> Fe </SafeText>
    <SafeText y={1580} size={42}>INI KIMIA, BUKAN KUTUKAN.</SafeText>
  </>
);

const StoneCookScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <ellipse cx={540} cy={1260} rx={250} ry={90} fill="#2B2233" stroke="#FFB15C" strokeWidth={6} />
    {Array.from({ length: 5 }, (_, i) => (
      <ellipse key={i} cx={410 + i * 65} cy={1210 + Math.sin(p * 8 + i + seed) * 8} rx={38} ry={26} fill="#6A5A55" stroke="#FF9A4D" strokeWidth={3} />
    ))}
    <circle cx={540} cy={1050} r={90 + p * 20} fill="#FF7A32" opacity={0.35} filter="url(#bhBlur)" />
    <SafeText y={1600} size={40}>MASAK PAKAI BATU PANAS.</SafeText>
  </>
);

const RubberKeyScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <rect x={360} y={880} width={360} height={500} rx={20} fill="#17122A" stroke="#FFB15C" strokeWidth={6} />
    <g transform={`translate(${540 + Math.sin(p * 8 + seed) * 30} 1120) rotate(${p * 30})`}>
      <circle cx="-70" cy={0} r={50} fill="none" stroke="#E4664A" strokeWidth={22} />
      <rect x="-10" y="-14" width={180} height={28} rx={14} fill="#E4664A" />
      <rect x={120} y="-14" width={28} height={60} rx={8} fill="#E4664A" />
    </g>
    <SafeText y={1600} size={40}>KUNCI PAKAI KARET.</SafeText>
  </>
);

const RopeScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <path d={`M220 900 Q540 ${1000 + Math.sin(p * 7 + seed) * 40} 860 880`} fill="none" stroke="#C9A06B" strokeWidth={14} />
    {Array.from({ length: 5 }, (_, i) => (
      <path key={i} d={`M${300 + i * 120} ${940 + Math.sin(i + p * 5) * 14} L${300 + i * 120} 1240`} stroke="#C9A06B" strokeWidth={8} />
    ))}
    <SafeText y={1600} size={40}>PAKU DIGANTI TALI.</SafeText>
  </>
);

const StoneBladeScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <g transform={`translate(${540 + Math.sin(p * 6 + seed) * 20} 1050) rotate(${-12 + p * 12})`}>
      <path d="M-40 180 L40 180 L20 -120 L0 -240 L-20 -120 Z" fill="#8A8177" stroke="#FFB15C" strokeWidth={5} />
      <path d="M0 -240 L20 -120 L40 180" fill="#CFC3B1" opacity={0.5} />
    </g>
    <SafeText y={1600} size={40}>PISAU? BATU TAJAM.</SafeText>
  </>
);

const MoScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <g transform={`translate(540 1060) scale(${1.55 + Math.sin(p * Math.PI) * 0.06}) translate(-540 -1060)`}>
      <Stick x={540} y={1380} s={1.5} flip sad />
    </g>
    <SafeText y={1600} size={36} fill="#FFD8AE">JAMAN BATU, TAPI WiFi NGGAK.</SafeText>
  </>
);

const WoodRocketScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="lab" />
    <g transform={`translate(540 ${900 - p * 120}) rotate(${Math.sin(p * 6 + seed) * 8})`}>
      <rect x="-60" y="-260" width={120} height={420} rx={60} fill="#A97747" stroke="#FFB15C" strokeWidth={6} />
      <path d="M-60 100 L-110 220 L0 160 L110 220 L60 100 Z" fill="#7A5434" stroke="#FF9A4D" strokeWidth={5} />
      <circle cx={0} cy="-120" r={46} fill="#1A1228" stroke="#8FD3FF" strokeWidth={5} />
      <path d="M-60 180 Q-120 260 -40 320 Q0 360 40 320 Q120 260 60 180" fill="#FF7A32" opacity={0.6 + p * 0.4} />
    </g>
    <SafeText y={1610} size={36} fill="#FFB15C" font={FONT.ui}>ROKET KAYU, JALAN.</SafeText>
  </>
);

const WindScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => {
  const bend = Math.sin(p * Math.PI) * 150;
  return (
    <>
      <Backdrop p={p} seed={seed} mode="lab" />
      <g transform={`translate(540 900) rotate(${bend / 3})`}>
        <rect x="-55" y="-260" width={110} height={430} rx={55} fill="#A97747" stroke="#FFB15C" strokeWidth={6} />
        <path d={`M-55 170 Q${-bend} 300 ${bend} 420 L55 170 Z`} fill="#7A5434" stroke="#FF9A4D" strokeWidth={5} />
      </g>
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M${60 + i * 20} ${680 + i * 120} Q${540 + Math.sin(p * 9 + i + seed) * 180} ${760 + i * 120} ${980 - i * 20} ${700 + i * 120}`} fill="none" stroke="#FFD8AE" strokeWidth={4} opacity={0.4} />
      ))}
      <SafeText y={1610} size={40}>MELENGKUNG DITIUP ANGIN.</SafeText>
    </>
  );
};

const CrashScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    <g transform={`translate(${240 + p * 300} ${1120 + Math.sin(p * 8 + seed) * 30}) rotate(${p * 110})`}>
      <rect x="-50" y="-200" width={100} height={330} rx={50} fill="#A97747" stroke="#FFB15C" strokeWidth={5} />
      <path d="M-50 130 L-90 210 L0 160 L90 210 L50 130 Z" fill="#7A5434" />
    </g>
    {Array.from({ length: 8 }, (_, i) => (
      <circle key={i} cx={300 + i * 70} cy={1300 + Math.sin(i + p * 6) * 30} r={7 + (i % 3) * 4} fill="#6FA35A" />
    ))}
    <SafeText y={1620} size={38}>JATUH DI KEBUN.</SafeText>
  </>
);

const BraveScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="lab" />
    {Array.from({ length: 4 }, (_, i) => (
      <Stick key={i} x={280 + i * 170} y={1320 + (i % 2) * 40} s={1.3} lean={Math.sin(p * 7 + i + seed) * 6} />
    ))}
    <SafeText y={1600} size={40}>YANG PENTING BERANI.</SafeText>
  </>
);

const SafeScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="lab" />
    <g transform={`translate(540 1050) scale(${1.6 + Math.sin(p * Math.PI) * 0.05}) translate(-540 -1050)`}>
      <Stick x={540} y={1380} s={1.5} sad flip lean={-8} />
    </g>
    <SafeText y={1600} size={40}>YANG PENTING NGGAK MELEDAK.</SafeText>
  </>
);

const CultScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    {Array.from({ length: 6 }, (_, i) => (
      <Stick key={i} x={190 + i * 140} y={1350 + (i % 2) * 50} s={1.2 + (i % 3) * 0.1} sad={i % 2 === 0} lean={Math.sin(p * 6 + i + seed) * 5} />
    ))}
    <circle cx={540} cy={1080} r={80 + Math.sin(p * 10 + seed) * 14} fill="#A9552E" opacity={0.8} />
    <SafeText y={1620} size={40}>SEKTE KARAT MUNCUL.</SafeText>
  </>
);

const WorshipScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    <g transform="translate(540 1120)">
      <ellipse cx={0} cy={120} rx={200} ry={70} fill="#A9552E" stroke="#FFB15C" strokeWidth={5} />
      <circle cx={0} cy={0} r={70 + Math.sin(p * 9 + seed) * 12} fill="#C46A34" opacity={0.9} />
    </g>
    {Array.from({ length: 5 }, (_, i) => (
      <Stick key={i} x={260 + i * 140} y={1430} s={1.1} lean={70 + Math.sin(p * 6 + i) * 5} />
    ))}
    <SafeText y={1640} size={36} fill="#FFD8AE">NYEMBAH SISA BESI.</SafeText>
  </>
);

const RitualScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    {Array.from({ length: 5 }, (_, i) => (
      <g key={i} transform={`translate(${280 + i * 130} ${1120 + Math.sin(p * 8 + i + seed) * 18})`}>
        <path d="M-34 -60 L34 -60 L24 70 L-24 70 Z" fill="#5B2C24" stroke="#FFB15C" strokeWidth={4} />
        <ellipse cx={0} cy="-64" rx={34} ry={12} fill="#A9552E" />
      </g>
    ))}
    <SafeText y={1600} size={40}>MINUM AIR KARAT.</SafeText>
  </>
);

const HopeScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    <circle cx={540} cy={980} r={150 + Math.sin(p * 8 + seed) * 30} fill="#FFB15C" opacity={0.16} filter="url(#bhBlur)" />
    <circle cx={540} cy={980} r={62} fill="#C46A34" stroke="#FFD27A" strokeWidth={6} />
    <SafeText y={1600} size={44}>HARAPAN ITU MURAH.</SafeText>
  </>
);

const FaithScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    {Array.from({ length: 7 }, (_, i) => (
      <Stick key={i} x={130 + i * 135} y={1390 + (i % 3) * 30} s={1.15} sad={i % 2 === 0} />
    ))}
    <SafeText y={1640} size={36} fill="#FFD8AE">BUTUH SESUATU BUAT DIPERCAYA.</SafeText>
  </>
);

const YearScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="ruin" />
    <SafeText y={820} size={180} opacity={0.85}>365</SafeText>
    <SafeText y={930} size={40} fill="#FFB15C" font={FONT.ui}>HARI TANPA BESI</SafeText>
    <SafeText y={1600} size={42}>SETAHUN SUDAH.</SafeText>
  </>
);

const DrawerScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <rect x={230} y={820} width={620} height={520} rx={16} fill="#17122A" stroke="#FFB15C" strokeWidth={6} />
    <g transform={`translate(0 ${Math.sin(p * Math.PI) * 170})`}>
      <rect x={280} y={1080} width={520} height={220} rx={12} fill="#2B203E" stroke="#FF9A4D" strokeWidth={5} />
      <rect x={470} y={1160} width={140} height={22} rx={11} fill="#FFB15C" />
    </g>
    <SafeText y={1620} size={38}>TERUS GUA BUKA LACI DAPUR.</SafeText>
  </>
);

const DirtySpoonScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <g transform={`translate(${540 + Math.sin(p * 6 + seed) * 12} 1040) rotate(${8 + Math.sin(p * 7) * 6})`}>
      <rect x="-22" y="-240" width={44} height={330} rx={18} fill="#8E5B38" stroke="#FFB15C" strokeWidth={5} />
      <ellipse cx={0} cy="-280" rx={68} ry={92} fill="#A46B42" stroke="#FFB15C" strokeWidth={5} />
      <path d="M-30 -300 Q-10 -250 -34 -210 M20 -320 Q36 -270 12 -230" fill="none" stroke="#7A3D22" strokeWidth={10} opacity={0.8} />
      <circle cx={540} cy={960} r={120 + p * 40} fill="#FFB15C" opacity={0.14} filter="url(#bhBlur)" />
    </g>
    <SafeText y={1600} size={44}>ADA SENDOK BESI.</SafeText>
  </>
);

const FinalTextScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <g transform={`translate(540 980) scale(${pop(p)}) translate(-540 -980)`}>
      <SafeText y={930} size={64}>Satu-satunya harapan</SafeText>
      <SafeText y={1030} size={64}>umat manusia.</SafeText>
    </g>
    <SafeText y={1580} size={34} fill="#FFB15C" font={FONT.ui}>MASIH ADA KARATNYA</SafeText>
  </>
);

const HoldScene: React.FC<{ p: number; seed: number }> = ({ p, seed }) => (
  <>
    <Backdrop p={p} seed={seed} mode="room" />
    <g transform={`translate(540 1130) rotate(${Math.sin(p * 5 + seed) * 3})`}>
      <ellipse cx={0} cy={0} rx={58} ry={78} fill="#A46B42" stroke="#FFD27A" strokeWidth={6} />
      <rect x="-18" y={60} width={36} height={240} rx={16} fill="#8E5B38" stroke="#FFB15C" strokeWidth={4} />
      <circle cx={0} cy={0} r={150 + Math.sin(p * 9) * 30} fill="#FFB15C" opacity={0.12} filter="url(#bhBlur)" />
    </g>
    {Array.from({ length: 10 }, (_, i) => (
      <circle key={i} cx={380 + i * 35} cy={1340 + Math.sin(p * 7 + i + seed) * 22} r={3 + (i % 3)} fill="#FFD8AE" opacity={0.6} />
    ))}
    <SafeText y={1620} size={40}>MASIH HANGAT.</SafeText>
  </>
);

const Scene: React.FC<{ kind: string; day: number; seed: number; t: number; len: number }> = ({ kind, day, seed, t, len }) => {
  const p = clamp(t / Math.max(1, len));
  switch (kind) {
    case 'title': return <HookTitle p={p} seed={seed} />;
    case 'day': return <DayCard day={day} p={p} seed={seed} />;
    case 'phone': return <PhoneScene p={p} seed={seed} />;
    case 'molten': return <MoltenScene p={p} seed={seed} />;
    case 'hand': return <HandScene p={p} seed={seed} />;
    case 'panic': return <PanicScene p={p} seed={seed} />;
    case 'handle': return <HandleScene p={p} seed={seed} />;
    case 'car': return <CarScene p={p} seed={seed} />;
    case 'traffic': return <TrafficScene p={p} seed={seed} />;
    case 'ask': return <AskScene p={p} seed={seed} />;
    case 'pan': return <PanScene p={p} seed={seed} />;
    case 'knife': return <KnifeScene p={p} seed={seed} />;
    case 'spoon': return <SpoonScene p={p} seed={seed} />;
    case 'handeat': return <HandEatScene p={p} seed={seed} />;
    case 'cry': return <CryScene p={p} seed={seed} />;
    case 'building': return <BuildingScene p={p} seed={seed} />;
    case 'rail': return <RailScene p={p} seed={seed} />;
    case 'bridge': return <BridgeScene p={p} seed={seed} />;
    case 'city': return <CityScene p={p} seed={seed} />;
    case 'blood': return <BloodScene p={p} seed={seed} />;
    case 'oxygen': return <OxygenScene p={p} seed={seed} />;
    case 'faint': return <FaintScene p={p} seed={seed} />;
    case 'scientist': return <ScientistScene p={p} seed={seed} />;
    case 'stonecook': return <StoneCookScene p={p} seed={seed} />;
    case 'rubberkey': return <RubberKeyScene p={p} seed={seed} />;
    case 'rope': return <RopeScene p={p} seed={seed} />;
    case 'stoneblade': return <StoneBladeScene p={p} seed={seed} />;
    case 'mo': return <MoScene p={p} seed={seed} />;
    case 'woodrocket': return <WoodRocketScene p={p} seed={seed} />;
    case 'wind': return <WindScene p={p} seed={seed} />;
    case 'crash': return <CrashScene p={p} seed={seed} />;
    case 'brave': return <BraveScene p={p} seed={seed} />;
    case 'safe': return <SafeScene p={p} seed={seed} />;
    case 'cult': return <CultScene p={p} seed={seed} />;
    case 'worship': return <WorshipScene p={p} seed={seed} />;
    case 'ritual': return <RitualScene p={p} seed={seed} />;
    case 'hope': return <HopeScene p={p} seed={seed} />;
    case 'faith': return <FaithScene p={p} seed={seed} />;
    case 'year': return <YearScene p={p} seed={seed} />;
    case 'drawer': return <DrawerScene p={p} seed={seed} />;
    case 'dirtyspoon': return <DirtySpoonScene p={p} seed={seed} />;
    case 'finaltext': return <FinalTextScene p={p} seed={seed} />;
    case 'hold': return <HoldScene p={p} seed={seed} />;
    default: return <Backdrop p={p} seed={seed} />;
  }
};

export const ShotMap: EngineShotMap = Object.fromEntries(
  Object.entries(SHOT_SPEC).map(([id, spec]) => [
    id,
    (props: ShotProps) => <Scene kind={spec.kind} day={spec.day} seed={spec.seed} t={props.t} len={props.len} />,
  ]),
);

export { W as VIDEO_WIDTH, H as VIDEO_HEIGHT };
