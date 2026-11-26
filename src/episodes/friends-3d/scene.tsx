import {useEffect, useMemo} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import * as THREE from 'three';

type Vec3 = [number, number, number];

const hash = (value: number) => {
  const x = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const CAMERA_PATHS: Array<{
  from: Vec3;
  to: Vec3;
  lookFrom: Vec3;
  lookTo: Vec3;
}> = [
  {
    from: [0, 1.9, 5.4],
    to: [0.35, 1.45, 3.1],
    lookFrom: [0, 1.1, 0],
    lookTo: [0.2, 0.7, -0.8],
  },
  {
    from: [-1.6, 2.4, 8.4],
    to: [0.5, 2.2, 1.6],
    lookFrom: [0, 1.4, -2],
    lookTo: [0.4, 1.1, -6],
  },
  {
    from: [0, 2.1, 7.2],
    to: [0, 2.3, 3.1],
    lookFrom: [0, 2.1, -0.5],
    lookTo: [0, 2.3, -1.5],
  },
  {
    from: [-2, 3.3, 7],
    to: [1.5, 2.7, 1.2],
    lookFrom: [0, 0.4, -2],
    lookTo: [0.2, -0.3, -5],
  },
  {
    from: [0, 1.9, 6.8],
    to: [0, 1.6, 1.4],
    lookFrom: [0, 1.4, -2],
    lookTo: [0, 1.3, -5],
  },
  {
    from: [0, 2.2, 8],
    to: [0, 2, 2.6],
    lookFrom: [0, 1.8, -3],
    lookTo: [0, 1.8, -5],
  },
  {
    from: [0, 2.2, 6.2],
    to: [0.25, 2, 3],
    lookFrom: [0, 1.35, -1],
    lookTo: [0.1, 1.25, -2],
  },
  {
    from: [0, 1.6, 5],
    to: [0, -4.2, 2],
    lookFrom: [0, 0.8, 0],
    lookTo: [0, -1.5, 0],
  },
];

const FrameSync: React.FC<{frame: number}> = ({frame}) => {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [frame, invalidate]);
  return null;
};

const CameraRig: React.FC<{index: number; p: number}> = ({index, p}) => {
  const camera = useThree((state) => state.camera);
  const path = CAMERA_PATHS[index] ?? CAMERA_PATHS[0];

  useFrame(() => {
    const shakeAmount = index === 4 || index === 7 ? 0.11 : 0.035;
    const step = Math.floor(p * 42);
    const shakeX = (hash(step + index * 19) - 0.5) * shakeAmount;
    const shakeY = (hash(step + index * 37 + 5) - 0.5) * shakeAmount;
    camera.position.set(
      lerp(path.from[0], path.to[0], p) + shakeX,
      lerp(path.from[1], path.to[1], p) + shakeY,
      lerp(path.from[2], path.to[2], p),
    );
    camera.lookAt(
      lerp(path.lookFrom[0], path.lookTo[0], p),
      lerp(path.lookFrom[1], path.lookTo[1], p),
      lerp(path.lookFrom[2], path.lookTo[2], p),
    );
  });

  return null;
};

const Effects: React.FC<{p: number}> = ({p}) => (
  <EffectComposer multisampling={0} enableNormalPass={false}>
    <Bloom intensity={1.15} luminanceThreshold={0.22} mipmapBlur />
    <Noise opacity={0.045 + hash(Math.floor(p * 36)) * 0.055} premultiply />
    <Vignette offset={0.24} darkness={0.78} />
  </EffectComposer>
);

const GlitchFloor: React.FC<{p: number}> = ({p}) => {
  const tiles = useMemo(
    () =>
      Array.from({length: 81}, (_, index) => ({
        seed: index,
        x: ((index % 9) - 4) * 0.62,
        z: (Math.floor(index / 9) - 4) * 0.62,
      })),
    [],
  );
  const step = Math.floor(p * 24);

  return (
    <group>
      {tiles.map((tile) => {
        const q = hash(tile.seed + step * 7.3);
        const lift = q > 0.86 ? (hash(tile.seed + step) - 0.5) * 0.6 : 0;
        const color = q > 0.94 ? '#f2fbff' : q > 0.78 ? '#39f6ff' : '#08080e';
        return (
          <mesh key={tile.seed} position={[tile.x, 0.03 + lift, tile.z]}>
            <boxGeometry args={[0.56, 0.05, 0.56]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={q > 0.78 ? 1.1 : 0.06}
              roughness={0.35}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const BedroomScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <GlitchFloor p={p} />
    <mesh position={[0, 1.8, -2.6]}>
      <boxGeometry args={[6.2, 3.6, 0.16]} />
      <meshStandardMaterial color="#111128" emissive="#14143a" emissiveIntensity={0.35} />
    </mesh>
    <mesh position={[-3.1, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
      <boxGeometry args={[5.2, 3.6, 0.16]} />
      <meshStandardMaterial color="#0d0d20" />
    </mesh>
    <mesh position={[1.25, 0.35, -0.7]}>
      <boxGeometry args={[2.5, 0.65, 2.1]} />
      <meshStandardMaterial color="#2a2144" roughness={0.8} />
    </mesh>
    <mesh position={[1.25, 0.78, -1.35]}>
      <boxGeometry args={[2.35, 0.2, 0.55]} />
      <meshStandardMaterial color="#5d517f" />
    </mesh>
    <mesh position={[-1.8, 0.55, -1.9]}>
      <boxGeometry args={[1.7, 1.1, 0.7]} />
      <meshStandardMaterial color="#1c1c34" />
    </mesh>
    <mesh
      position={[0.4 + Math.sin(p * 9) * 0.03, 1.15 + Math.sin(p * 13) * 0.05, -0.7]}
      rotation={[-0.35, 0.4 + p * 0.25, 0.2]}
    >
      <boxGeometry args={[0.52, 0.94, 0.07]} />
      <meshStandardMaterial
        color="#bdfcff"
        emissive="#34e8ff"
        emissiveIntensity={hash(Math.floor(p * 30)) > 0.7 ? 3.2 : 1.4}
      />
    </mesh>
    <pointLight position={[0.4, 1.6, -0.2]} color="#48f4ff" intensity={18} distance={7} />
    <pointLight position={[-2.4, 2.6, 1.5]} color="#ff3d81" intensity={7} distance={8} />
  </group>
);

const Car: React.FC<{
  position: Vec3;
  color: string;
  p: number;
  seed: number;
  scale?: number;
}> = ({position, color, p, seed, scale = 1}) => {
  const jitter = (hash(seed + Math.floor(p * 30)) - 0.5) * 0.08;
  return (
    <group
      position={[position[0] + jitter, position[1] + Math.sin(p * 4 + seed) * 0.03, position[2]]}
      scale={scale}
      rotation={[0, (hash(seed) - 0.5) * 0.3, 0]}
    >
      <mesh>
        <boxGeometry args={[1.35, 0.42, 2.4]} />
        <meshStandardMaterial color={color} metalness={0.65} roughness={0.28} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 0.38, -0.1]}>
        <boxGeometry args={[1.05, 0.36, 1.15]} />
        <meshStandardMaterial color="#10182c" metalness={0.7} roughness={0.2} />
      </mesh>
      {[
        [-0.72, -0.25, 0.8],
        [0.72, -0.25, 0.8],
        [-0.72, -0.25, -0.8],
        [0.72, -0.25, -0.8],
      ].map((wheel, index) => (
        <mesh key={index} position={wheel as Vec3} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.16, 12]} />
          <meshStandardMaterial color="#050508" />
        </mesh>
      ))}
    </group>
  );
};

const StreetScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.06, -3]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[12, 34]} />
      <meshStandardMaterial color="#0a0914" roughness={0.95} />
    </mesh>
    {[-3.2, 3.2].map((x) => (
      <mesh key={x} position={[x, 2.4, -3]}>
        <boxGeometry args={[1.6, 4.8, 30]} />
        <meshStandardMaterial color="#11102a" emissive="#2a0a4a" emissiveIntensity={0.45} />
      </mesh>
    ))}
    {Array.from({length: 22}, (_, index) => {
      const side = index % 2 === 0 ? -3.15 : 3.15;
      const z = 8 - Math.floor(index / 2) * 2.4;
      const bright = hash(index + Math.floor(p * 18)) > 0.55;
      return (
        <mesh key={index} position={[side, 0.8 + (index % 4) * 0.7, z]} rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <boxGeometry args={[0.45, 0.5, 0.06]} />
          <meshBasicMaterial color={bright ? '#b45cff' : '#2a2250'} />
        </mesh>
      );
    })}
    <Car position={[-1.1, 1.4, 1.5]} color="#ff3d81" p={p} seed={2} />
    <Car position={[1.3, 2.1, -2.2]} color="#4de2ff" p={p} seed={7} />
    <Car position={[-0.7, 3.0, -5.5]} color="#b45cff" p={p} seed={11} scale={0.85} />
    <Car position={[1.8, 1.1, -8]} color="#ffd23d" p={p} seed={17} scale={0.9} />
    <pointLight position={[0, 5, -2]} color="#a855ff" intensity={22} distance={22} />
    <pointLight position={[0, 1, 5]} color="#42f5ff" intensity={8} distance={12} />
  </group>
);

const HologramHead: React.FC<{p: number}> = ({p}) => {
  const flicker = hash(Math.floor(p * 28)) > 0.78 ? 0.28 : 0.62;
  return (
    <group position={[0, 2.25, -0.8]} rotation={[0, -0.25 + Math.sin(p * 5) * 0.18, 0]} scale={1.35}>
      <mesh>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshStandardMaterial color="#8cfcff" emissive="#00d9ff" emissiveIntensity={2.2} transparent opacity={flicker} roughness={0.2} />
      </mesh>
      <mesh scale={1.04}>
        <sphereGeometry args={[0.72, 18, 18]} />
        <meshBasicMaterial color="#d9ffff" wireframe transparent opacity={0.32} />
      </mesh>
      <mesh position={[-0.25, 0.12, 0.66]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#08121a" />
      </mesh>
      <mesh position={[0.25, 0.12, 0.66]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#08121a" />
      </mesh>
      <mesh position={[0, -0.24, 0.68]}>
        <boxGeometry args={[0.32, 0.06, 0.04]} />
        <meshBasicMaterial color="#ff4d5e" />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[1.35, 0.22, 1.1]} />
        <meshStandardMaterial color="#12313d" emissive="#00d9ff" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, -0.95, 0]}>
        <boxGeometry args={[1.7, 0.8, 0.7]} />
        <meshStandardMaterial color="#12313d" emissive="#00d9ff" emissiveIntensity={0.7} transparent opacity={0.65} />
      </mesh>
    </group>
  );
};

const CampusScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, 2.4, -3.4]}>
      <boxGeometry args={[7.5, 4.8, 0.5]} />
      <meshStandardMaterial color="#15152e" emissive="#1b1b52" emissiveIntensity={0.4} />
    </mesh>
    {[-2.6, -0.9, 0.9, 2.6].map((x) => (
      <mesh key={x} position={[x, 1.9, -3.05]}>
        <boxGeometry args={[0.45, 3.8, 0.45]} />
        <meshStandardMaterial color="#242450" emissive="#3b3b8a" emissiveIntensity={0.35} />
      </mesh>
    ))}
    <mesh position={[0, 0.15, -0.8]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.55, 0.035, 8, 64]} />
      <meshBasicMaterial color="#6cf6ff" />
    </mesh>
    <mesh position={[0, -0.25, -0.8]}>
      <cylinderGeometry args={[0.85, 1.1, 0.5, 24]} />
      <meshStandardMaterial color="#1a1a38" emissive="#6cf6ff" emissiveIntensity={0.4} />
    </mesh>
    <HologramHead p={p} />
    <pointLight position={[0, 2.2, 0.4]} color="#4ff6ff" intensity={24} distance={9} />
    <pointLight position={[-3, 4, 2]} color="#ff3d81" intensity={8} distance={12} />
  </group>
);

const Avatar: React.FC<{
  position: Vec3;
  rotation?: Vec3;
  color?: string;
  p?: number;
  running?: boolean;
}> = ({position, rotation = [0, 0, 0], color = '#ff3df5', p = 0, running = false}) => {
  const stride = running ? Math.sin(p * 42) * 0.42 : Math.sin(p * 6) * 0.08;
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.35, 0]}>
        <capsuleGeometry args={[0.22, 0.45, 6, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.27, 18, 18]} />
        <meshStandardMaterial color="#f3e9ff" emissive={color} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[-0.14, 0.72, 0]} rotation={[stride, 0, 0]}>
        <boxGeometry args={[0.18, 0.75, 0.2]} />
        <meshStandardMaterial color="#1b1730" />
      </mesh>
      <mesh position={[0.14, 0.72, 0]} rotation={[-stride, 0, 0]}>
        <boxGeometry args={[0.18, 0.75, 0.2]} />
        <meshStandardMaterial color="#1b1730" />
      </mesh>
      <mesh position={[-0.36, 1.42, 0]} rotation={[-stride * 0.7, 0, 0]}>
        <boxGeometry args={[0.15, 0.65, 0.16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.36, 1.42, 0]} rotation={[stride * 0.7, 0, 0]}>
        <boxGeometry args={[0.15, 0.65, 0.16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

const VoidScene: React.FC<{p: number}> = ({p}) => {
  const jump = (p * 3) % 1;
  const jumpY = Math.sin(jump * Math.PI) * 1.55;
  const avatarZ = 1.8 - p * 6.6;
  const avatarX = Math.sin(p * 9) * 0.55;
  const codeBlocks = useMemo(
    () =>
      Array.from({length: 64}, (_, index) => ({
        seed: index,
        x: (hash(index) - 0.5) * 4.4,
        y: -2.6 + hash(index + 40) * 2.6,
        z: -0.6 - hash(index + 90) * 6.2,
      })),
    [],
  );
  const step = Math.floor(p * 30);

  return (
    <group>
      {[2.1, -0.7, -3.5, -6.3].map((z, index) => (
        <mesh key={z} position={[0, -0.12, z]}>
          <boxGeometry args={[4.2, 0.24, 2]} />
          <meshStandardMaterial color="#1b1b2c" emissive="#3d8bff" emissiveIntensity={0.18} />
        </mesh>
      ))}
      {codeBlocks.map((block) => {
        const q = hash(block.seed + step * 3.1);
        return (
          <mesh
            key={block.seed}
            position={[block.x, block.y - ((p * 2 + q) % 1) * 1.5, block.z]}
            rotation={[q * 0.8, q * 1.4, 0]}
          >
            <boxGeometry args={[0.06, 0.34 + q * 0.5, 0.06]} />
            <meshBasicMaterial color={q > 0.6 ? '#63a8ff' : '#1e63ff'} />
          </mesh>
        );
      })}
      <Avatar
        position={[avatarX, jumpY, avatarZ]}
        rotation={[0, Math.sin(p * 7) * 0.25, jump > 0.5 ? 0.15 : -0.1]}
        color="#ff3df5"
        p={p}
        running
      />
      <pointLight position={[0, -1, -3]} color="#2e7bff" intensity={26} distance={12} />
      <pointLight position={[0, 3, 1]} color="#ff3df5" intensity={10} distance={10} />
    </group>
  );
};

const Clone: React.FC<{position: Vec3; seed: number; p: number}> = ({position, seed, p}) => {
  const step = Math.floor(p * 22);
  const jitter = (hash(seed + step) - 0.5) * 0.22;
  const tilt = (hash(seed + step + 9) - 0.5) * 0.28;
  return (
    <group position={[position[0] + jitter, position[1], position[2]]} rotation={[0, 0, tilt]}>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.62, 0.9, 0.42]} />
        <meshStandardMaterial color="#5d1030" emissive="#ff3d81" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <boxGeometry args={[0.48, 0.48, 0.44]} />
        <meshStandardMaterial color="#ff7aa8" emissive="#ff3d81" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.18, 0.55, 0]}>
        <boxGeometry args={[0.2, 0.9, 0.2]} />
        <meshStandardMaterial color="#36112a" />
      </mesh>
      <mesh position={[0.18, 0.55, 0]}>
        <boxGeometry args={[0.2, 0.9, 0.2]} />
        <meshStandardMaterial color="#36112a" />
      </mesh>
      <mesh position={[0.52, 1.45, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.045, 0.045, 1.2, 8]} />
        <meshStandardMaterial color="#9aa2b5" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0.92, 1.95, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.55, 0.22, 0.08]} />
        <meshStandardMaterial color="#d6e1ff" metalness={0.7} roughness={0.2} emissive="#ff3d81" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};

const AlleyScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.05, -2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[8, 26]} />
      <meshStandardMaterial color="#090610" roughness={0.95} />
    </mesh>
    {[-3.2, 3.2].map((x, index) => (
      <mesh key={x} position={[x, 2.2, -2]}>
        <boxGeometry args={[0.6, 4.4, 24]} />
        <meshStandardMaterial color="#120b1d" emissive={index === 0 ? '#ff3d81' : '#7a2bff'} emissiveIntensity={0.28} />
      </mesh>
    ))}
    {[-1, 1].map((side, index) => (
      <mesh key={side} position={[side * 3.02, 3.1, -3.5 + index]} rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
        <boxGeometry args={[1.2, 0.45, 0.06]} />
        <meshBasicMaterial color={index === 0 ? '#ff3d81' : '#6cf6ff'} />
      </mesh>
    ))}
    <Avatar
      position={[Math.sin(p * 12) * 0.35, 0, 1.6 - p * 5.6]}
      rotation={[0, Math.PI + Math.sin(p * 8) * 0.2, 0]}
      color="#6cf6ff"
      p={p}
      running
    />
    <Clone position={[-1.1, 0, -3.6 + p * 1.2]} seed={3} p={p} />
    <Clone position={[1.2, 0, -5.4 + p * 1.6]} seed={13} p={p} />
    <Clone position={[-0.2, 0, -7.2 + p * 2]} seed={23} p={p} />
    <pointLight position={[0, 3, -3]} color="#ff3d81" intensity={26} distance={16} />
    <pointLight position={[0, 2, 3]} color="#5cf7ff" intensity={10} distance={10} />
  </group>
);

const Cable: React.FC<{points: Vec3[]; color: string}> = ({points, color}) => {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
    [points],
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, 64, 0.035, 8, false]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
    </mesh>
  );
};

const ServerScene: React.FC<{p: number}> = ({p}) => {
  const cables = useMemo<Array<{points: Vec3[]; color: string}>>(
    () => [
      {points: [[-2.4, 2.8, -4], [-1, 1.4, -2.5], [0.4, 0.6, -1.2], [1.8, 1.8, 0]], color: '#ffd23d'},
      {points: [[2.6, 2.4, -4.2], [1.2, 1.1, -2.8], [-0.4, 1.6, -1.4], [-2, 0.5, 0.2]], color: '#3df5ff'},
      {points: [[-1.8, 3.2, -3.6], [-0.2, 2.6, -2], [1.6, 2.2, -0.6], [2.8, 1.2, 0.6]], color: '#ff3d81'},
    ],
    [],
  );
  const pressed = p > 0.62;
  const screenColor = pressed ? '#ffd23d' : '#17313a';

  return (
    <group>
      <mesh position={[0, -0.05, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 20]} />
        <meshStandardMaterial color="#080a0f" metalness={0.5} roughness={0.6} />
      </mesh>
      {[-2.5, -1.4, 1.4, 2.5].map((x, index) => (
        <mesh key={x} position={[x, 1.9, -3.4 - (index % 2) * 0.4]}>
          <boxGeometry args={[0.9, 3.8, 0.9]} />
          <meshStandardMaterial color="#0d1420" metalness={0.7} roughness={0.35} emissive="#123044" emissiveIntensity={0.25} />
        </mesh>
      ))}
      {Array.from({length: 18}, (_, index) => {
        const x = index % 2 === 0 ? -2.5 : 2.5;
        const y = 0.4 + Math.floor(index / 2) * 0.36;
        const bright = hash(index + Math.floor(p * 16)) > 0.45;
        return (
          <mesh key={index} position={[x, y, -2.92]}>
            <boxGeometry args={[0.34, 0.08, 0.05]} />
            <meshBasicMaterial color={bright ? '#9dfcff' : '#1c3a44'} />
          </mesh>
        );
      })}
      <mesh position={[0, 2.1, -4.6]}>
        <boxGeometry args={[3.6, 2, 0.18]} />
        <meshBasicMaterial color={screenColor} />
      </mesh>
      <mesh position={[0, 2.1, -4.48]}>
        <planeGeometry args={[3.3, 1.7]} />
        <meshBasicMaterial color={pressed ? '#fff0a8' : '#071018'} />
      </mesh>
      <mesh position={[0, 0.42, 0.2]}>
        <cylinderGeometry args={[0.5, 0.6, 0.45, 24]} />
        <meshStandardMaterial color="#181c24" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, pressed ? 0.58 : 0.72, 0.2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.14, 24]} />
        <meshStandardMaterial color={pressed ? '#ffd23d' : '#ff5d5d'} emissive={pressed ? '#ffd23d' : '#ff3d3d'} emissiveIntensity={pressed ? 3 : 1.2} />
      </mesh>
      {cables.map((cable, index) => (
        <Cable key={index} points={cable.points} color={cable.color} />
      ))}
      <Avatar
        position={[0, 0, 1.9 - p * 1.6]}
        color="#6cf6ff"
        p={p}
        running
      />
      <pointLight position={[0, 2.4, -2]} color="#ffd23d" intensity={24} distance={12} />
      <pointLight position={[0, 1, 3]} color="#4ff6ff" intensity={10} distance={10} />
    </group>
  );
};

const Friend: React.FC<{position: Vec3; color: string; seed: number; p: number}> = ({position, color, seed, p}) => {
  const sip = Math.sin(p * 6 + seed) * 0.08;
  return (
    <group position={position} rotation={[0, (seed - 1) * 0.18, 0]}>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.75, 1.1, 0.55]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshStandardMaterial color="#ffd9b8" />
      </mesh>
      <mesh position={[-0.13, 1.6, 0.31]}>
        <boxGeometry args={[0.26, 0.12, 0.06]} />
        <meshBasicMaterial color="#050508" />
      </mesh>
      <mesh position={[0.13, 1.6, 0.31]}>
        <boxGeometry args={[0.26, 0.12, 0.06]} />
        <meshBasicMaterial color="#050508" />
      </mesh>
      <mesh position={[0, 1.42, 0.33]}>
        <boxGeometry args={[0.26, 0.04, 0.04]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[0.48, 1.28 + sip, 0.2]} rotation={[0.4, 0, -0.6]}>
        <cylinderGeometry args={[0.13, 0.11, 0.26, 16]} />
        <meshStandardMaterial color="#f4f0ff" />
      </mesh>
    </group>
  );
};

const VipScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.05, -1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[12, 18]} />
      <meshStandardMaterial color="#1a1220" metalness={0.35} roughness={0.55} />
    </mesh>
    <mesh position={[0, 0.55, -2.4]}>
      <boxGeometry args={[5.4, 0.9, 1.4]} />
      <meshStandardMaterial color="#4a1c3a" emissive="#ffb84d" emissiveIntensity={0.32} roughness={0.6} />
    </mesh>
    <mesh position={[0, 1, -2.4]}>
      <boxGeometry args={[5.6, 0.25, 1.5]} />
      <meshStandardMaterial color="#6d2547" />
    </mesh>
    <mesh position={[0, 0.42, 0.2]}>
      <boxGeometry args={[2.8, 0.18, 1.4]} />
      <meshStandardMaterial color="#2c1b2e" metalness={0.7} roughness={0.25} />
    </mesh>
    <Friend position={[-1.45, 0.8, -2.2]} color="#7a2bff" seed={0} p={p} />
    <Friend position={[0, 0.8, -2.35]} color="#ff3d81" seed={1} p={p} />
    <Friend position={[1.45, 0.8, -2.2]} color="#3df5ff" seed={2} p={p} />
    <mesh position={[-3.6, 2.15, -1.2]} rotation={[0, Math.PI / 2, 0]}>
      <boxGeometry args={[3.4, 2.1, 0.18]} />
      <meshStandardMaterial color="#0b0b12" metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[-3.48, 2.15, -1.2]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[3.1, 1.8]} />
      <meshBasicMaterial color="#071018" side={THREE.DoubleSide} />
    </mesh>
    <Avatar position={[-3.4, 1.45, -1.2]} rotation={[0, Math.PI / 2, 0]} color="#ff3df5" p={p} running />
    <mesh position={[-3.42, 2.85, -1.2]}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshBasicMaterial color="#ff2d3d" />
    </mesh>
    <pointLight position={[0, 3.4, 2]} color="#ffb84d" intensity={26} distance={14} />
    <pointLight position={[-3, 2.5, 0]} color="#5cf7ff" intensity={10} distance={10} />
  </group>
);

const KickedScene: React.FC<{p: number}> = ({p}) => {
  const shards = useMemo(
    () =>
      Array.from({length: 48}, (_, index) => ({
        seed: index,
        x: (hash(index) - 0.5) * 8,
        y: (hash(index + 70) - 0.5) * 10,
        z: (hash(index + 130) - 0.5) * 8,
      })),
    [],
  );
  const step = Math.floor(p * 34);

  return (
    <group>
      {shards.map((shard) => {
        const q = hash(shard.seed + step);
        return (
          <mesh
            key={shard.seed}
            position={[shard.x, shard.y - p * 3 + q * 0.6, shard.z]}
            rotation={[q * 2, q * 3, p * 2]}
          >
            <boxGeometry args={[0.05 + q * 0.16, 0.5 + q * 1.4, 0.05]} />
            <meshBasicMaterial color={q > 0.5 ? '#ff3d3d' : '#3df5ff'} />
          </mesh>
        );
      })}
      {[0, 1, 2, 3].map((ring) => (
        <mesh key={ring} position={[0, 0.4 - ring * 1.35 + p * 2, -0.5]} rotation={[Math.PI / 2, 0, p * ring]}>
          <torusGeometry args={[1.4 + ring * 0.42, 0.03, 8, 64]} />
          <meshBasicMaterial color={ring % 2 === 0 ? '#ff3d3d' : '#3df5ff'} />
        </mesh>
      ))}
      <Avatar
        position={[0, 1 - p * 5.4, 0]}
        rotation={[p * 2.4, p * 1.6, p * 3.2]}
        color="#ff3df5"
        p={p}
        running
      />
      <pointLight position={[0, 0, 1]} color="#ff3d3d" intensity={28} distance={14} />
    </group>
  );
};

const SceneContent: React.FC<{index: number; p: number}> = ({index, p}) => {
  switch (index) {
    case 0:
      return <BedroomScene p={p} />;
    case 1:
      return <StreetScene p={p} />;
    case 2:
      return <CampusScene p={p} />;
    case 3:
      return <VoidScene p={p} />;
    case 4:
      return <AlleyScene p={p} />;
    case 5:
      return <ServerScene p={p} />;
    case 6:
      return <VipScene p={p} />;
    case 7:
      return <KickedScene p={p} />;
    default:
      return <BedroomScene p={p} />;
  }
};

export const SceneCanvas: React.FC<{
  index: number;
  frame: number;
  totalFrames: number;
}> = ({index, frame, totalFrames}) => {
  const p = frame / Math.max(1, totalFrames - 1);

  return (
    <Canvas
      frameloop="demand"
      dpr={1}
      camera={{fov: 50, near: 0.1, far: 100, position: [0, 2, 7]}}
      gl={{antialias: true, alpha: false, preserveDrawingBuffer: true}}
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
    >
      <color attach="background" args={['#04020a']} />
      <fog attach="fog" args={['#04020a', 7, 28]} />
      <FrameSync frame={frame} />
      <CameraRig index={index} p={p} />
      <ambientLight intensity={0.42} />
      <SceneContent index={index} p={p} />
      <Effects p={p} />
    </Canvas>
  );
};
