import {useEffect} from 'react';
import * as THREE from 'three';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {Bloom, EffectComposer, Noise, Vignette} from '@react-three/postprocessing';
import {useCurrentFrame} from 'remotion';

type Vec3 = [number, number, number];

const hash = (n: number) => {
  const value = Math.sin(n * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

const PALETTES = [
  {bg: '#04070d', fog: '#04070d', accent: '#5ff7ff', key: '#b8fbff'},
  {bg: '#080311', fog: '#080311', accent: '#b45cff', key: '#e2b8ff'},
  {bg: '#030810', fog: '#030810', accent: '#6cf6ff', key: '#c7fbff'},
  {bg: '#0b0802', fog: '#0b0802', accent: '#ffd23d', key: '#fff0b3'},
  {bg: '#020c09', fog: '#020c09', accent: '#7dffd0', key: '#ccfff0'},
  {bg: '#0c0310', fog: '#0c0310', accent: '#ff8ad4', key: '#ffd0ec'},
  {bg: '#0c0702', fog: '#0c0702', accent: '#ffb84d', key: '#ffe0b3'},
  {bg: '#080004', fog: '#080004', accent: '#ff3d5e', key: '#ffc2cb'},
] as const;

const CAMERA_PATHS: Array<{from: Vec3; to: Vec3; lookFrom: Vec3; lookTo: Vec3}> = [
  {
    from: [0, 1.9, 6],
    to: [0.35, 1.45, 3.2],
    lookFrom: [0, 1.2, -1.4],
    lookTo: [0.25, 0.9, -1.8],
  },
  {
    from: [-2.2, 1.05, 7.4],
    to: [1.5, 4.1, 2.7],
    lookFrom: [0, 0.95, -2],
    lookTo: [0, 0.35, -5.5],
  },
  {
    from: [0, 2.35, 5.4],
    to: [0.6, 1.75, 2.8],
    lookFrom: [0, 1.65, -0.6],
    lookTo: [0, 1.45, -1.8],
  },
  {
    from: [0, 4.5, 10],
    to: [-1.6, 1.25, 4.2],
    lookFrom: [0, 1.2, -3],
    lookTo: [0.4, 0.8, -5],
  },
  {
    from: [0, 1.4, 3.6],
    to: [0, 2.85, 7.4],
    lookFrom: [0, 0.8, 0],
    lookTo: [0, 1.45, -1.2],
  },
  {
    from: [-1.8, 2, 5],
    to: [0.2, 1.55, 2.7],
    lookFrom: [0, 1.55, -0.5],
    lookTo: [0, 1.3, -1.5],
  },
  {
    from: [-1.15, 0.95, 5.6],
    to: [0.1, 1.6, 2.6],
    lookFrom: [0, 1.2, -0.8],
    lookTo: [0, 1.45, -1.4],
  },
  {
    from: [0, 1.7, 4.6],
    to: [0, 1.7, 2.8],
    lookFrom: [0, 1.2, 0],
    lookTo: [0, 1.2, 0],
  },
];

const FrameSync: React.FC<{frame: number; totalFrames: number; index: number}> = ({
  frame,
  totalFrames,
  index,
}) => {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [frame, invalidate]);
  const p = Math.min(1, Math.max(0, frame / Math.max(1, totalFrames - 1)));
  return <group userData={{frame, totalFrames, scene: index, progress: p}} />;
};

const CameraRig: React.FC<{index: number; p: number}> = ({index, p}) => {
  const {camera} = useThree();
  const path = CAMERA_PATHS[index];
  const q = smooth(p);

  useFrame(() => {
    const shake = p > 0.86 && p < 0.96 ? 0.045 : 0;
    camera.position.set(
      lerp(path.from[0], path.to[0], q) + Math.sin(p * 133) * shake,
      lerp(path.from[1], path.to[1], q) + Math.cos(p * 117) * shake,
      lerp(path.from[2], path.to[2], q),
    );
    camera.lookAt(
      lerp(path.lookFrom[0], path.lookTo[0], q),
      lerp(path.lookFrom[1], path.lookTo[1], q),
      lerp(path.lookFrom[2], path.lookTo[2], q),
    );
    camera.updateProjectionMatrix();
  });

  return null;
};

const Effects: React.FC<{strength: number}> = ({strength}) => (
  <EffectComposer multisampling={0}>
    <Bloom
      intensity={strength}
      luminanceThreshold={0.32}
      luminanceSmoothing={0.18}
      mipmapBlur
    />
    <Noise opacity={0.035} premultiply />
    <Vignette eskil={false} offset={0.16} darkness={0.78} />
  </EffectComposer>
);

const ContactShadow: React.FC<{position: Vec3; scale?: number}> = ({
  position,
  scale = 0.9,
}) => (
  <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
    <circleGeometry args={[scale, 32]} />
    <meshBasicMaterial color="#000000" transparent opacity={0.38} depthWrite={false} />
  </mesh>
);

const Person: React.FC<{
  position: Vec3;
  color: string;
  p: number;
  seed?: number;
  scale?: number;
  headphones?: boolean;
  signing?: boolean;
  facing?: number;
}> = ({position, color, p, seed = 0, scale = 1, headphones = false, signing = false, facing = 0}) => {
  const bob = Math.sin(p * 7 + seed) * 0.035;
  const armA = signing ? Math.sin(p * 10 + seed) * 0.85 - 0.45 : -0.18;
  const armB = signing ? Math.sin(p * 10 + seed + 1.7) * 0.85 - 0.45 : 0.16;

  return (
    <group position={position} scale={scale} rotation={[0, facing, 0]}>
      <ContactShadow position={[0, 0.025, 0]} scale={0.62} />
      <group position={[0, bob, 0]}>
        <mesh position={[0, 1.02, 0]} castShadow>
          <capsuleGeometry args={[0.34, 0.62, 6, 14]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.78, 0]} castShadow>
          <sphereGeometry args={[0.36, 24, 20]} />
          <meshStandardMaterial color="#ffd7c4" roughness={0.78} />
        </mesh>
        <mesh position={[-0.13, 1.82, 0.33]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshBasicMaterial color="#111018" />
        </mesh>
        <mesh position={[0.13, 1.82, 0.33]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshBasicMaterial color="#111018" />
        </mesh>
        <group position={[-0.4, 1.22, 0]} rotation={[0, 0, armA]}>
          <mesh position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.095, 0.42, 4, 10]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.58, 0]}>
            <sphereGeometry args={[0.11, 12, 10]} />
            <meshStandardMaterial color="#ffd7c4" roughness={0.8} />
          </mesh>
        </group>
        <group position={[0.4, 1.22, 0]} rotation={[0, 0, armB]}>
          <mesh position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.095, 0.42, 4, 10]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.58, 0]}>
            <sphereGeometry args={[0.11, 12, 10]} />
            <meshStandardMaterial color="#ffd7c4" roughness={0.8} />
          </mesh>
        </group>
        <mesh position={[-0.13, 0.45, 0]}>
          <capsuleGeometry args={[0.12, 0.42, 4, 10]} />
          <meshStandardMaterial color="#121824" roughness={0.9} />
        </mesh>
        <mesh position={[0.13, 0.45, 0]}>
          <capsuleGeometry args={[0.12, 0.42, 4, 10]} />
          <meshStandardMaterial color="#121824" roughness={0.9} />
        </mesh>
        {headphones ? (
          <group>
            <mesh position={[0, 1.82, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.42, 0.055, 10, 32]} />
              <meshStandardMaterial color="#dffcff" emissive="#5ff7ff" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[-0.42, 1.6, 0]}>
              <boxGeometry args={[0.13, 0.26, 0.2]} />
              <meshStandardMaterial color="#dffcff" emissive="#5ff7ff" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[0.42, 1.6, 0]}>
              <boxGeometry args={[0.13, 0.26, 0.2]} />
              <meshStandardMaterial color="#dffcff" emissive="#5ff7ff" emissiveIntensity={1.2} />
            </mesh>
          </group>
        ) : null}
      </group>
    </group>
  );
};

const SoundRing: React.FC<{
  position: Vec3;
  radius: number;
  color: string;
  opacity: number;
  rotation?: Vec3;
}> = ({position, radius, color, opacity, rotation = [0, 0, 0]}) => (
  <mesh position={position} rotation={rotation}>
    <torusGeometry args={[radius, 0.022, 8, 48]} />
    <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
  </mesh>
);

const Clock: React.FC<{p: number}> = ({p}) => {
  const lit = Math.sin(p * 34) > 0;
  return (
    <group position={[-1.75, 1.75, -2.1]}>
      <mesh>
        <boxGeometry args={[1.35, 0.9, 0.24]} />
        <meshStandardMaterial color="#15212d" roughness={0.55} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.14]}>
        <planeGeometry args={[1.08, 0.65]} />
        <meshStandardMaterial
          color={lit ? '#9dfcff' : '#1b3b45'}
          emissive={lit ? '#5ff7ff' : '#08232c'}
          emissiveIntensity={lit ? 2.4 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.94, 0]}>
        <boxGeometry args={[0.7, 0.3, 0.18]} />
        <meshStandardMaterial color="#1b2a38" roughness={0.5} />
      </mesh>
    </group>
  );
};

const AlarmScene: React.FC<{p: number}> = ({p}) => {
  const shatter = smooth((p - 0.32) / 0.3);
  return (
    <group>
      <mesh position={[0, -0.03, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#0a1420" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.1, -4]}>
        <planeGeometry args={[16, 9]} />
        <meshStandardMaterial color="#07111c" roughness={1} />
      </mesh>
      <mesh position={[0.9, 0.45, -0.9]}>
        <boxGeometry args={[2.3, 0.65, 1.5]} />
        <meshStandardMaterial color="#172b3a" roughness={0.85} />
      </mesh>
      <mesh position={[0.77, 0.84, -0.9]}>
        <boxGeometry args={[0.75, 0.22, 1.25]} />
        <meshStandardMaterial color="#d9f6ff" roughness={0.7} />
      </mesh>
      <Clock p={p} />
      {[0, 1, 2, 3].map((i) => (
        <SoundRing
          key={i}
          position={[-1.75, 1.75, -1.9]}
          radius={0.45 + i * 0.34 + shatter * i * 0.14}
          color="#5ff7ff"
          opacity={p < 0.32 ? 0.55 - i * 0.08 : Math.max(0, 0.2 - shatter * 0.16)}
        />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh
          key={i}
          position={[
            -1.75 + Math.cos(i * 0.82) * (0.7 + shatter * 1.8),
            1.75 + Math.sin(i * 0.82) * (0.5 + shatter * 1.3),
            -1.7 + hash(i) * 0.7,
          ]}
          rotation={[hash(i + 9) * 3, hash(i + 4) * 3, shatter * hash(i) * 5]}
        >
          <boxGeometry args={[0.05, 0.18 + hash(i) * 0.22, 0.03]} />
          <meshBasicMaterial
            color="#9dfcff"
            transparent
            opacity={shatter * (0.45 + hash(i + 2) * 0.5)}
          />
        </mesh>
      ))}
      <Person position={[1.25, 0.7, -0.2]} color="#274966" p={p} seed={2} scale={0.96} />
      <pointLight position={[-1.6, 2.6, 0.4]} color="#5ff7ff" intensity={3.2} distance={9} />
      <pointLight position={[2.8, 1.4, 2.4]} color="#b45cff" intensity={1.5} distance={10} />
    </group>
  );
};

const Car: React.FC<{
  position: Vec3;
  color: string;
  p: number;
  seed: number;
  scale?: number;
  mouth?: boolean;
}> = ({position, color, p, seed, scale = 1, mouth = true}) => (
  <group position={position} scale={scale} rotation={[0, Math.sin(p * 1.7 + seed) * 0.08, 0]}>
    <ContactShadow position={[0, 0.03, 0]} scale={1.05} />
    <mesh position={[0, 0.55, 0]}>
      <boxGeometry args={[1.55, 0.55, 2.7]} />
      <meshStandardMaterial color={color} roughness={0.42} metalness={0.45} />
    </mesh>
    <mesh position={[0, 1, -0.15]}>
      <boxGeometry args={[1.3, 0.5, 1.4]} />
      <meshStandardMaterial color="#12202d" roughness={0.28} metalness={0.5} />
    </mesh>
    {mouth ? (
      <mesh position={[0, 0.58, 1.38]}>
        <boxGeometry args={[0.82, 0.12, 0.05]} />
        <meshBasicMaterial color="#030008" />
      </mesh>
    ) : null}
    {[-0.78, 0.78].flatMap((x) =>
      [-0.86, 0.86].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.28, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 0.16, 16]} />
          <meshStandardMaterial color="#080b10" roughness={0.9} />
        </mesh>
      )),
    )}
  </group>
);

const Pigeon: React.FC<{position: Vec3; p: number; seed: number}> = ({position, p, seed}) => {
  const flap = Math.sin(p * 14 + seed) * 0.7;
  return (
    <group position={position} scale={0.45}>
      <mesh>
        <sphereGeometry args={[0.42, 16, 12]} />
        <meshStandardMaterial color="#9a9db5" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.28, 0.32]}>
        <sphereGeometry args={[0.2, 14, 10]} />
        <meshStandardMaterial color="#b9bdd2" roughness={0.9} />
      </mesh>
      <mesh position={[-0.36, 0.18, 0]} rotation={[0, 0, flap]}>
        <boxGeometry args={[0.5, 0.08, 0.28]} />
        <meshStandardMaterial color="#c3c9df" roughness={0.85} />
      </mesh>
      <mesh position={[0.36, 0.18, 0]} rotation={[0, 0, -flap]}>
        <boxGeometry args={[0.5, 0.08, 0.28]} />
        <meshStandardMaterial color="#c3c9df" roughness={0.85} />
      </mesh>
    </group>
  );
};

const Violin: React.FC<{p: number}> = ({p}) => (
  <group position={[2.05, 1.12, -1.15]} rotation={[0, -0.5, -0.25]}>
    <mesh>
      <capsuleGeometry args={[0.22, 0.38, 4, 12]} />
      <meshStandardMaterial color="#8b3f19" roughness={0.5} metalness={0.2} />
    </mesh>
    <mesh position={[0, 0.58, 0]}>
      <boxGeometry args={[0.09, 0.7, 0.07]} />
      <meshStandardMaterial color="#591e0a" roughness={0.7} />
    </mesh>
    <mesh position={[0.35, 0.1, 0.16]} rotation={[0, 0, 0.7 + Math.sin(p * 11) * 0.25]}>
      <boxGeometry args={[0.95, 0.025, 0.025]} />
      <meshStandardMaterial color="#f2dfc4" roughness={0.6} />
    </mesh>
  </group>
);

const StreetScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.04, -2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[28, 28]} />
      <meshStandardMaterial color="#0c0a15" roughness={0.95} />
    </mesh>
    {[-6.5, -3.8, 3.6, 6.4].map((x, i) => (
      <mesh key={x} position={[x, 2.1 + hash(i) * 1.5, -8 - hash(i + 3) * 3]}>
        <boxGeometry args={[2.2 + hash(i) * 1.2, 5 + hash(i) * 3, 2.4]} />
        <meshStandardMaterial color={i % 2 ? '#191128' : '#111a29'} roughness={0.88} />
      </mesh>
    ))}
    <Car position={[-2.8, 0, -1]} color="#6a2fb0" p={p} seed={1} scale={0.9} />
    <Car position={[2.9, 0, -2.3]} color="#167f8d" p={p} seed={4} scale={0.85} />
    <Car position={[0.2, 0, -5.2]} color="#c05c1d" p={p} seed={7} scale={1.35} />
    <Pigeon position={[-1.1, 0.42, -3.2]} p={p} seed={2} />
    <Pigeon position={[1.2, 0.5, -3.8]} p={p} seed={6} />
    <Person position={[1.85, 0, -1.5]} color="#5a2b72" p={p} seed={3} facing={-0.5} />
    <Violin p={p} />
    <Person position={[-0.55, 0, 1]} color="#1b4c5b" p={p} seed={9} facing={0.12} />
    <pointLight position={[-3, 4, 1]} color="#b45cff" intensity={2.8} distance={14} />
    <pointLight position={[3.5, 2.4, 0]} color="#5ff7ff" intensity={2.4} distance={12} />
  </group>
);

const Phone: React.FC<{position: Vec3; p: number; seed: number; active: boolean}> = ({
  position,
  p,
  seed,
  active,
}) => (
  <group position={position} rotation={[0, Math.sin(p * 2 + seed) * 0.35, 0]}>
    <mesh>
      <boxGeometry args={[0.72, 1.25, 0.1]} />
      <meshStandardMaterial color="#101b28" roughness={0.4} metalness={0.5} />
    </mesh>
    <mesh position={[0, 0, 0.06]}>
      <planeGeometry args={[0.58, 1.04]} />
      <meshStandardMaterial
        color={active ? '#0a2a30' : '#20101a'}
        emissive={active ? '#0b6a75' : '#5b0b2a'}
        emissiveIntensity={active ? 1.1 : 0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
    {[0, 1, 2].map((i) => (
      <SoundRing
        key={i}
        position={[0, 0, 0.08]}
        radius={0.18 + i * 0.18 + Math.sin(p * 5 + seed) * 0.03}
        color="#6cf6ff"
        opacity={active ? 0.7 - i * 0.16 : 0.08}
      />
    ))}
  </group>
);

const MessageCard: React.FC<{position: Vec3; p: number; seed: number}> = ({position, p, seed}) => (
  <group
    position={[
      position[0],
      position[1] + Math.sin(p * 3 + seed) * 0.14,
      position[2],
    ]}
    rotation={[0, hash(seed) * 0.7 - 0.35, Math.sin(p * 4 + seed) * 0.08]}
  >
    <mesh>
      <boxGeometry args={[0.95, 0.62, 0.05]} />
      <meshStandardMaterial color="#101a24" roughness={0.6} metalness={0.2} />
    </mesh>
    <mesh position={[0, 0.21, 0.035]}>
      <planeGeometry args={[0.7, 0.09]} />
      <meshBasicMaterial color="#6cf6ff" transparent opacity={0.55} />
    </mesh>
    <mesh position={[-0.18, -0.04, 0.035]}>
      <planeGeometry args={[0.34, 0.06]} />
      <meshBasicMaterial color="#6cf6ff" transparent opacity={0.26} />
    </mesh>
    <mesh position={[-0.28, -0.2, 0.035]}>
      <planeGeometry args={[0.14, 0.05]} />
      <meshBasicMaterial color="#6cf6ff" transparent opacity={0.18} />
    </mesh>
  </group>
);

const CallsScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.04, -2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[26, 26]} />
      <meshStandardMaterial color="#07121a" roughness={0.95} />
    </mesh>
    {[-3.2, -1.6, 1.6, 3.2].map((x, i) => (
      <Person
        key={x}
        position={[x, 0, -3.4 - hash(i) * 1.6]}
        color={i % 2 ? '#27425f' : '#4b2b63'}
        p={p}
        seed={i * 2}
        scale={0.78}
        signing
        facing={x < 0 ? 0.3 : -0.3}
      />
    ))}
    <Phone position={[-1.9, 1.55, 0.2]} p={p} seed={1} active={p < 0.52} />
    <Phone position={[0.2, 2.05, -0.6]} p={p} seed={3} active={p < 0.36} />
    <Phone position={[2.1, 1.35, 0.1]} p={p} seed={5} active={p < 0.22} />
    <MessageCard position={[-1.2, 0.85, 1.25]} p={p} seed={2} />
    <MessageCard position={[0.9, 0.65, 1.4]} p={p} seed={6} />
    <Person position={[0, 0, 1.85]} color="#1b4c5b" p={p} seed={8} scale={1.05} />
    <pointLight position={[0, 2.8, 2]} color="#6cf6ff" intensity={3} distance={11} />
    <pointLight position={[-3.5, 1.5, -1]} color="#ff1744" intensity={1.8} distance={9} />
  </group>
);

const Building: React.FC<{position: Vec3; size: Vec3; p: number; seed: number}> = ({
  position,
  size,
  p,
  seed,
}) => (
  <group position={position}>
    <mesh>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#1a1a12" roughness={0.92} />
    </mesh>
    <mesh position={[0, -size[1] / 2 + 0.75, size[2] / 2 + 0.03]} rotation={[0, Math.sin(p * 2 + seed) * 0.45, 0]}>
      <boxGeometry args={[Math.min(0.8, size[0] * 0.55), 1.4, 0.06]} />
      <meshStandardMaterial color="#ffd23d" emissive="#7a5300" emissiveIntensity={0.9} />
    </mesh>
    {[0, 1].map((i) => (
      <mesh key={i} position={[-size[0] / 4 + (i * size[0]) / 2, 0.4, size[2] / 2 + 0.04]}>
        <planeGeometry args={[0.35, 0.5]} />
        <meshBasicMaterial color="#ffe9a3" transparent opacity={0.35 + hash(seed + i) * 0.4} />
      </mesh>
    ))}
  </group>
);

const Bell: React.FC<{position: Vec3; p: number; seed: number}> = ({position, p, seed}) => (
  <group position={position} rotation={[0, 0, Math.sin(p * 6 + seed) * 0.25]}>
    <mesh>
      <torusGeometry args={[0.42, 0.025, 8, 30]} />
      <meshBasicMaterial color="#ffd23d" transparent opacity={0.6} wireframe />
    </mesh>
    <mesh position={[0, -0.4, 0]}>
      <sphereGeometry args={[0.07, 10, 8]} />
      <meshBasicMaterial color="#ffd23d" transparent opacity={0.7} />
    </mesh>
  </group>
);

const Dog: React.FC<{position: Vec3; p: number; seed: number}> = ({position, p, seed}) => (
  <group position={position} scale={0.5} rotation={[0, Math.sin(p * 2 + seed) * 0.5, 0]}>
    <ContactShadow position={[0, 0.04, 0]} scale={0.62} />
    <mesh position={[0, 0.5, 0]}>
      <capsuleGeometry args={[0.28, 0.5, 4, 10]} />
      <meshStandardMaterial color="#8d6a4d" roughness={0.95} />
    </mesh>
    <mesh position={[0, 0.88, 0.28]}>
      <sphereGeometry args={[0.26, 14, 12]} />
      <meshStandardMaterial color="#a37c5b" roughness={0.95} />
    </mesh>
    <mesh position={[0, 0.78, 0.53]}>
      <boxGeometry args={[0.22, 0.06, 0.04]} />
      <meshBasicMaterial color="#120508" />
    </mesh>
  </group>
);

const CityScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.04, -2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[32, 32]} />
      <meshStandardMaterial color="#0d0d06" roughness={0.96} />
    </mesh>
    <Building position={[-4.6, 2.1, -6]} size={[2.6, 4.2, 2.2]} p={p} seed={1} />
    <Building position={[-1.7, 3, -8]} size={[2.4, 6, 2.2]} p={p} seed={2} />
    <Building position={[1.8, 2.5, -6.5]} size={[3, 5, 2]} p={p} seed={3} />
    <Building position={[5, 3.4, -8.5]} size={[2.6, 6.8, 2.4]} p={p} seed={4} />
    <Person position={[0, 0, -1.2]} color="#7a4d16" p={p} seed={5} facing={-0.2} />
    <mesh position={[0.72, 1.45, -0.85]} rotation={[0, 0, -0.75 + Math.sin(p * 5) * 0.4]}>
      <boxGeometry args={[1.5, 0.045, 0.045]} />
      <meshStandardMaterial color="#fff0b3" emissive="#ffd23d" emissiveIntensity={1.3} />
    </mesh>
    <Bell position={[-2.6, 2.1, -2.5]} p={p} seed={2} />
    <Bell position={[2.7, 2.4, -3]} p={p} seed={5} />
    <Bell position={[4.1, 1.8, -4]} p={p} seed={7} />
    <Dog position={[-2.2, 0, 1.5]} p={p} seed={3} />
    <Dog position={[2.1, 0, 1.1]} p={p} seed={8} />
    <Person position={[0.95, 0, 2.1]} color="#1b4c5b" p={p} seed={9} facing={-0.5} />
    <pointLight position={[0, 4.8, 1]} color="#ffd23d" intensity={3.2} distance={16} />
    <pointLight position={[-4, 1.4, 2]} color="#b45cff" intensity={1.6} distance={12} />
  </group>
);

const GlassDome: React.FC = () => (
  <group position={[0, 0.65, -1.5]}>
    <mesh>
      <sphereGeometry args={[2.75, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial
        color="#7dffd0"
        transparent
        opacity={0.16}
        roughness={0.12}
        metalness={0.25}
        side={THREE.DoubleSide}
      />
    </mesh>
    <mesh>
      <sphereGeometry args={[2.77, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial color="#7dffd0" wireframe transparent opacity={0.11} />
    </mesh>
    <mesh position={[0, -0.08, 0]}>
      <cylinderGeometry args={[2.85, 2.95, 0.22, 40]} />
      <meshStandardMaterial color="#0a2019" roughness={0.6} metalness={0.35} />
    </mesh>
  </group>
);

const Switch: React.FC<{p: number}> = ({p}) => {
  const down = smooth((p - 0.55) / 0.2);
  return (
    <group position={[0, 0.78, -1.45]}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.72, 0.85, 0.35, 24]} />
        <meshStandardMaterial color="#153a2f" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.72 - down * 0.42, 0]} rotation={[0, 0, lerp(-0.35, 0.45, down)]}>
        <capsuleGeometry args={[0.15, 0.75, 5, 12]} />
        <meshStandardMaterial
          color="#d8fff2"
          emissive="#7dffd0"
          emissiveIntensity={2.2}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <torusGeometry args={[0.62, 0.03, 8, 32]} />
        <meshBasicMaterial color="#7dffd0" transparent opacity={0.75} />
      </mesh>
    </group>
  );
};

const CounterPanel: React.FC<{position: Vec3; color: string; p: number; seed: number}> = ({
  position,
  color,
  p,
  seed,
}) => (
  <group position={position} rotation={[0, Math.sin(p * 1.3 + seed) * 0.1, 0]}>
    <mesh>
      <boxGeometry args={[2.1, 0.82, 0.12]} />
      <meshStandardMaterial color="#0b1a17" roughness={0.5} metalness={0.4} />
    </mesh>
    <mesh position={[0, 0, 0.075]}>
      <planeGeometry args={[1.82, 0.58]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.4 + Math.sin(p * 8 + seed) * 0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  </group>
);

const SwitchScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.05, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[26, 26]} />
      <meshStandardMaterial color="#04120e" roughness={0.94} />
    </mesh>
    <GlassDome />
    <Switch p={p} />
    <CounterPanel position={[-2.2, 2.5, -1.2]} color="#7dffd0" p={p} seed={1} />
    <CounterPanel position={[2.2, 2.5, -1.2]} color="#ff4f8b" p={p} seed={4} />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
      <mesh key={i} position={[-1.65 + i * 0.3, 1.55, -1.15]}>
        <boxGeometry args={[0.16, 0.35, 0.06]} />
        <meshBasicMaterial
          color="#7dffd0"
          transparent
          opacity={i / 12 < p ? 0.9 : 0.18}
        />
      </mesh>
    ))}
    <Person position={[0, 0.1, -1.3]} color="#1b4c5b" p={p} seed={6} scale={0.72} />
    <pointLight position={[0, 3.6, 0.6]} color="#7dffd0" intensity={4} distance={13} />
    <pointLight position={[-3.5, 1.5, 2]} color="#ff4f8b" intensity={1.5} distance={10} />
  </group>
);

const Bubble: React.FC<{position: Vec3; scale: number; opacity: number; color: string}> = ({
  position,
  scale,
  opacity,
  color,
}) => (
  <mesh position={position} scale={scale}>
    <sphereGeometry args={[0.32, 16, 12]} />
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={1.2}
      transparent
      opacity={opacity}
      roughness={0.1}
      metalness={0.15}
      depthWrite={false}
    />
  </mesh>
);

const BubblesScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.04, -2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[24, 24]} />
      <meshStandardMaterial color="#0e0412" roughness={0.94} />
    </mesh>
    <Person position={[0.7, 0, -0.75]} color="#1b4c5b" p={p} seed={2} facing={-0.35} />
    <Person position={[-1.2, 0, -1.2]} color="#6a2e58" p={p} seed={5} scale={0.86} signing facing={0.3} />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => {
      const birth = (i / 14) * 0.62;
      const t = Math.max(0, p - birth) / 0.46;
      const pop = t > 0.82;
      const scale = Math.max(
        0.001,
        (0.4 + hash(i) * 0.55) * (pop ? Math.max(0, 1 - (t - 0.82) / 0.18) : 0.55 + t * 0.6),
      );
      return (
        <Bubble
          key={i}
          position={[
            0.75 + Math.sin(i * 2.7 + t * 2.4) * (0.35 + t * 0.85),
            1.62 + t * (1.5 + hash(i + 3) * 0.7),
            -0.55 - t * 0.45,
          ]}
          scale={scale}
          opacity={t > 1 ? 0 : 0.26 + hash(i + 1) * 0.42}
          color={i % 3 === 0 ? '#ff8ad4' : i % 3 === 1 ? '#c996ff' : '#6cf6ff'}
        />
      );
    })}
    <pointLight position={[1.2, 2.4, 0.6]} color="#ff8ad4" intensity={3.2} distance={11} />
    <pointLight position={[-2.4, 1.6, 0.4]} color="#6cf6ff" intensity={1.8} distance={10} />
  </group>
);

const PointingArm: React.FC = () => (
  <mesh position={[-0.45, 1.46, 0.1]} rotation={[0, 0, -0.42]}>
    <capsuleGeometry args={[0.1, 0.85, 4, 10]} />
    <meshStandardMaterial color="#d9a23a" roughness={0.8} />
  </mesh>
);

const MicIcon: React.FC<{p: number}> = ({p}) => (
  <group
    position={[0.75, 2.55 + Math.sin(p * 4) * 0.1, -0.6]}
    rotation={[0, 0, Math.sin(p * 3) * 0.2]}
  >
    <mesh>
      <capsuleGeometry args={[0.16, 0.3, 5, 12]} />
      <meshStandardMaterial color="#ffe0b3" emissive="#ffb84d" emissiveIntensity={1.6} />
    </mesh>
    <mesh position={[0, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.25, 0.03, 8, 24, Math.PI]} />
      <meshBasicMaterial color="#ffb84d" />
    </mesh>
  </group>
);

const HeadphonesScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.04, -1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[24, 24]} />
      <meshStandardMaterial color="#0e0903" roughness={0.94} />
    </mesh>
    <Person position={[-1.2, 0, 0.25]} color="#d9a23a" p={p} seed={4} scale={0.78} facing={0.35} />
    <PointingArm />
    <Person
      position={[0.75, 0, -0.95]}
      color="#1b4c5b"
      p={p}
      seed={7}
      headphones
      facing={-0.25}
    />
    <MicIcon p={p} />
    {[0, 1, 2, 3].map((i) => (
      <SoundRing
        key={i}
        position={[0.75, 1.8, -0.45]}
        radius={0.45 + i * 0.3}
        color="#ffb84d"
        opacity={0.55 - i * 0.1}
      />
    ))}
    <mesh position={[-2.1, 2.1, -2.3]}>
      <boxGeometry args={[1.5, 0.6, 0.1]} />
      <meshStandardMaterial color="#231300" emissive="#ffb84d" emissiveIntensity={0.9} />
    </mesh>
    <pointLight position={[0.8, 2.8, 0.8]} color="#ffb84d" intensity={3.6} distance={12} />
    <pointLight position={[-2.6, 1.4, 2]} color="#5ff7ff" intensity={1.4} distance={10} />
  </group>
);

const BlackoutScene: React.FC<{p: number}> = ({p}) => {
  const fade = 1 - ease((p - 0.25) / 0.4);
  return (
    <group>
      <mesh position={[0, -0.04, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#0d0105" roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.5, -2.4]}>
        <boxGeometry args={[3.4, 1.2, 0.12]} />
        <meshStandardMaterial
          color="#2a020b"
          emissive="#ff1744"
          emissiveIntensity={1.8 * fade}
        />
      </mesh>
      <Person position={[0, 0, -0.7]} color="#2a1220" p={p} seed={3} scale={0.85} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos(i * 0.78) * (1.1 + fade * 1.4),
            1.5 + Math.sin(i * 0.78) * (0.8 + fade * 1.1),
            -1.4,
          ]}
          rotation={[hash(i) * 3, hash(i + 2) * 3, p * 4 + hash(i + 5) * 3]}
        >
          <boxGeometry args={[0.04, 0.24, 0.03]} />
          <meshBasicMaterial color="#ff1744" transparent opacity={fade * 0.8} />
        </mesh>
      ))}
      <pointLight position={[0, 2.4, 0.6]} color="#ff1744" intensity={4 * fade} distance={12} />
    </group>
  );
};

const SceneContent: React.FC<{index: number; p: number}> = ({index, p}) => {
  if (index === 0) return <AlarmScene p={p} />;
  if (index === 1) return <StreetScene p={p} />;
  if (index === 2) return <CallsScene p={p} />;
  if (index === 3) return <CityScene p={p} />;
  if (index === 4) return <SwitchScene p={p} />;
  if (index === 5) return <BubblesScene p={p} />;
  if (index === 6) return <HeadphonesScene p={p} />;
  return <BlackoutScene p={p} />;
};

export const SceneCanvas: React.FC<{
  index: number;
  frame: number;
  totalFrames: number;
}> = ({index, frame, totalFrames}) => {
  const palette = PALETTES[index];
  const p = Math.min(1, Math.max(0, frame / Math.max(1, totalFrames - 1)));
  const strength = index === 7 ? 0.55 : 0.9;

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{fov: 42, near: 0.1, far: 100, position: CAMERA_PATHS[index].from}}
      gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
      style={{position: 'absolute', inset: 0, zIndex: 1}}
    >
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.fog, 7, 28]} />
      <ambientLight intensity={0.35} color={palette.key} />
      <directionalLight position={[3, 6, 5]} intensity={1.1} color={palette.key} />
      <FrameSync frame={frame} totalFrames={totalFrames} index={index} />
      <CameraRig index={index} p={p} />
      <SceneContent index={index} p={p} />
      <Effects strength={strength} />
    </Canvas>
  );
};
