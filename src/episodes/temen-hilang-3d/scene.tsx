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

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const CAMERA_PATHS: Array<{
  from: Vec3;
  to: Vec3;
  lookFrom: Vec3;
  lookTo: Vec3;
}> = [
  {
    from: [0, 2.1, 6.2],
    to: [0.2, 1.5, 2.9],
    lookFrom: [0, 1.2, 0],
    lookTo: [0.1, 0.9, -0.6],
  },
  {
    from: [-1.8, 1.1, 7.4],
    to: [0.4, 2.6, 2.2],
    lookFrom: [0, 1.3, -1],
    lookTo: [0.3, 1.5, -5],
  },
  {
    from: [0, 2.4, 6.8],
    to: [0, 2.1, 2.7],
    lookFrom: [0, 2.2, -0.5],
    lookTo: [0, 2.3, -2],
  },
  {
    from: [-1.6, 2.6, 6.4],
    to: [0.9, 1.1, 2.1],
    lookFrom: [0, 0.9, -1],
    lookTo: [0.2, 0.2, -3.4],
  },
  {
    from: [0, 2.2, 8.2],
    to: [0.3, 1.9, 3.4],
    lookFrom: [0, 1.6, -2],
    lookTo: [0.2, 1.5, -5],
  },
  {
    from: [0, 2.3, 5.6],
    to: [0, 2, 2.4],
    lookFrom: [0, 1.8, -1],
    lookTo: [0, 1.8, -2.6],
  },
  {
    from: [0, 1.1, 6.6],
    to: [0, 1.5, 2.2],
    lookFrom: [0, 1.1, -1],
    lookTo: [0, 1.4, -4.5],
  },
  {
    from: [0, 1.3, 6.4],
    to: [0, 1.9, 3.1],
    lookFrom: [0, 1.5, -1],
    lookTo: [0, 1.7, -3.2],
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
    const shakeAmount = index === 6 || index === 7 ? 0.09 : 0.03;
    const step = Math.floor(p * 44);
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
    <Bloom intensity={1.2} luminanceThreshold={0.24} mipmapBlur />
    <Noise opacity={0.04 + hash(Math.floor(p * 36)) * 0.05} premultiply />
    <Vignette offset={0.24} darkness={0.76} />
  </EffectComposer>
);

const Avatar: React.FC<{
  position: Vec3;
  rotation?: Vec3;
  color: string;
  p: number;
  jaw?: boolean;
  phone?: boolean;
  opacity?: number;
}> = ({position, rotation = [0, 0, 0], color, p, jaw = false, phone = false, opacity = 1}) => {
  const bob = Math.sin(p * 9) * 0.035;
  const jawScale = jaw ? 0.5 + Math.abs(Math.sin(p * 12)) * 1.6 : 0.16;
  return (
    <group position={[position[0], position[1] + bob, position[2]]} rotation={rotation}>
      <mesh position={[0, 0.92, 0]}>
        <capsuleGeometry args={[0.32, 0.72, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.42} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.34, 20, 16]} />
        <meshStandardMaterial color="#ffd9b8" roughness={0.55} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh position={[-0.12, 1.68, 0.3]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#101018" />
      </mesh>
      <mesh position={[0.12, 1.68, 0.3]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#101018" />
      </mesh>
      <mesh position={[0, 1.48, 0.32]} scale={[1, jawScale, 1]}>
        <sphereGeometry args={[0.075, 10, 8]} />
        <meshStandardMaterial color="#3a1420" />
      </mesh>
      <mesh position={[-0.42, 1.02, 0]} rotation={[0, 0, phone ? 0.7 : 0.2]}>
        <capsuleGeometry args={[0.09, 0.5, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh position={[0.42, 1.02, 0]} rotation={[0, 0, phone ? -0.7 : -0.2]}>
        <capsuleGeometry args={[0.09, 0.5, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh position={[-0.16, 0.3, 0]}>
        <capsuleGeometry args={[0.11, 0.42, 4, 8]} />
        <meshStandardMaterial color="#20243a" />
      </mesh>
      <mesh position={[0.16, 0.3, 0]}>
        <capsuleGeometry args={[0.11, 0.42, 4, 8]} />
        <meshStandardMaterial color="#20243a" />
      </mesh>
      {phone ? (
        <mesh position={[0.36, 1.28, 0.42]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.22, 0.4, 0.04]} />
          <meshStandardMaterial color="#0a1020" emissive="#5ff7ff" emissiveIntensity={1.4} />
        </mesh>
      ) : null}
    </group>
  );
};

const Phone: React.FC<{position: Vec3; rotation?: Vec3; color?: string; p: number}> = ({
  position,
  rotation = [0, 0, 0],
  color = '#5ff7ff',
  p,
}) => (
  <group position={position} rotation={rotation}>
    <mesh>
      <boxGeometry args={[0.72, 1.32, 0.08]} />
      <meshStandardMaterial color="#0d1220" metalness={0.5} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0, 0.05]}>
      <planeGeometry args={[0.62, 1.18]} />
      <meshStandardMaterial color="#071018" emissive={color} emissiveIntensity={0.55 + Math.sin(p * 8) * 0.12} />
    </mesh>
    {[0, 1, 2].map((row) => (
      <mesh key={row} position={[-0.1, 0.36 - row * 0.3, 0.07]}>
        <boxGeometry args={[0.36 - row * 0.05, 0.1, 0.01]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.7} />
      </mesh>
    ))}
  </group>
);

const Horse: React.FC<{
  position: Vec3;
  rotation?: Vec3;
  color: string;
  p: number;
  dark?: boolean;
  scale?: number;
}> = ({position, rotation = [0, 0, 0], color, p, dark = false, scale = 1}) => {
  const gallop = Math.sin(p * 16);
  const material = dark ? '#0b0d16' : color;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 1.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.42, 1.05, 6, 12]} />
        <meshStandardMaterial color={material} roughness={0.62} emissive={dark ? '#000000' : color} emissiveIntensity={dark ? 0 : 0.12} />
      </mesh>
      <mesh position={[0, 1.86, -0.66]} rotation={[0.55, 0, 0]}>
        <capsuleGeometry args={[0.21, 0.62, 5, 10]} />
        <meshStandardMaterial color={material} roughness={0.62} />
      </mesh>
      <mesh position={[0, 2.18, -1.02]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.36, 0.4, 0.62]} />
        <meshStandardMaterial color={material} roughness={0.62} />
      </mesh>
      <mesh position={[0, 2.08, -1.36]}>
        <boxGeometry args={[0.28, 0.22, 0.2]} />
        <meshStandardMaterial color={dark ? '#0b0d16' : '#e8c9a0'} />
      </mesh>
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, 2.46, -0.94]} rotation={[0.2, 0, x * 2]}>
          <coneGeometry args={[0.09, 0.28, 6]} />
          <meshStandardMaterial color={material} />
        </mesh>
      ))}
      {[-0.28, 0.28].flatMap((x, side) =>
        [-0.52, 0.52].map((z, leg) => (
          <group
            key={`${x}-${z}`}
            position={[x, 1.12, z]}
            rotation={[gallop * (side === leg ? 0.42 : -0.42), 0, 0]}
          >
            <mesh position={[0, -0.52, 0]}>
              <capsuleGeometry args={[0.1, 0.82, 4, 8]} />
              <meshStandardMaterial color={material} roughness={0.65} />
            </mesh>
          </group>
        )),
      )}
      <mesh position={[0, 1.5, 0.78]} rotation={[-0.5, 0, 0]}>
        <coneGeometry args={[0.16, 0.9, 7]} />
        <meshStandardMaterial color={material} />
      </mesh>
      {dark ? (
        <>
          <mesh position={[-0.13, 2.24, -1.33]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color="#ff3d81" emissive="#ff3d81" emissiveIntensity={3} />
          </mesh>
          <mesh position={[0.13, 2.24, -1.33]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color="#ff3d81" emissive="#ff3d81" emissiveIntensity={3} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 1.72, 0]}>
          <boxGeometry args={[0.62, 0.14, 0.66]} />
          <meshStandardMaterial color="#7b3f1d" roughness={0.5} />
        </mesh>
      )}
    </group>
  );
};

const ChatCard: React.FC<{position: Vec3; color: string; p: number; seed: number}> = ({
  position,
  color,
  p,
  seed,
}) => {
  const rise = ((p * 0.7 + hash(seed) * 0.6) % 1) * 1.5;
  return (
    <group position={[position[0], position[1] + rise, position[2]]}>
      <mesh>
        <boxGeometry args={[1.2, 0.42, 0.04]} />
        <meshStandardMaterial color="#0b1220" emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.18, 0, 0.03]}>
        <boxGeometry args={[0.6, 0.08, 0.01]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};

const BedroomScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[16, 16]} />
      <meshStandardMaterial color="#0a0c18" roughness={0.9} />
    </mesh>
    <mesh position={[0, 2.2, -3.4]}>
      <boxGeometry args={[10, 5, 0.2]} />
      <meshStandardMaterial color="#12162a" />
    </mesh>
    <mesh position={[-2.4, 2.6, -3.28]}>
      <boxGeometry args={[1.8, 1.5, 0.06]} />
      <meshStandardMaterial color="#1b2b46" emissive="#5ff7ff" emissiveIntensity={0.75} />
    </mesh>
    <mesh position={[2.6, 0.45, -1.2]}>
      <boxGeometry args={[2.4, 0.5, 1.5]} />
      <meshStandardMaterial color="#252a44" />
    </mesh>
    <mesh position={[2.6, 0.95, -1.8]}>
      <boxGeometry args={[2.4, 0.7, 0.3]} />
      <meshStandardMaterial color="#2e3454" />
    </mesh>
    <mesh position={[-1.2, 0.55, -0.4]}>
      <boxGeometry args={[0.9, 0.12, 0.9]} />
      <meshStandardMaterial color="#303650" />
    </mesh>
    <mesh position={[-1.2, 1.1, -0.8]}>
      <boxGeometry args={[0.9, 1, 0.12]} />
      <meshStandardMaterial color="#303650" />
    </mesh>
    <mesh position={[-0.1, 1.05, 0.2]} rotation={[0, -0.3, 0]}>
      <boxGeometry args={[1.2, 0.08, 0.7]} />
      <meshStandardMaterial color="#1a2038" />
    </mesh>
    <Phone position={[-0.1, 1.35, 0.25]} rotation={[0, -0.3, 0]} color="#5ff7ff" p={p} />
    <ChatCard position={[0.9, 1.7, -0.2]} color="#5ff7ff" p={p} seed={1} />
    <ChatCard position={[1.2, 2.2, -0.6]} color="#b45cff" p={p} seed={2} />
    <ChatCard position={[0.7, 2.7, -1]} color="#5ff7ff" p={p} seed={3} />
    <pointLight position={[-0.2, 2.1, 1.2]} color="#5ff7ff" intensity={26} distance={9} />
    <pointLight position={[3, 3, -1]} color="#b45cff" intensity={14} distance={10} />
  </group>
);

const StreetScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.05, -2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#080a14" roughness={0.85} />
    </mesh>
    {[-4.2, 4.2].map((x) => (
      <mesh key={x} position={[x, 2.6, -4]}>
        <boxGeometry args={[2.4, 5.2, 1.6]} />
        <meshStandardMaterial color="#141828" />
      </mesh>
    ))}
    {[-4.2, 4.2].flatMap((x) =>
      [1.4, 2.8, 4.2].map((y) => (
        <mesh key={`${x}-${y}`} position={[x + (x < 0 ? 1.22 : -1.22), y, -3.18]}>
          <boxGeometry args={[0.36, 0.5, 0.04]} />
          <meshStandardMaterial color="#ffd23d" emissive="#ffd23d" emissiveIntensity={0.7} />
        </mesh>
      )),
    )}
    <mesh position={[-1.8, 1.7, -1.4]}>
      <cylinderGeometry args={[0.05, 0.07, 3.4, 8]} />
      <meshStandardMaterial color="#2a3048" />
    </mesh>
    <mesh position={[-1.8, 3.4, -1.4]}>
      <sphereGeometry args={[0.22, 12, 10]} />
      <meshStandardMaterial color="#ffe6a0" emissive="#ffd23d" emissiveIntensity={2.4} />
    </mesh>
    <mesh position={[2.2, 1.1, -2.6]}>
      <boxGeometry args={[2.2, 0.12, 1]} />
      <meshStandardMaterial color="#2a3048" />
    </mesh>
    <Avatar position={[0.2, 0, -0.6]} rotation={[0, -0.2, 0]} color="#4a5bd8" p={p} phone />
    <Phone position={[0.55, 1.3, -0.2]} rotation={[0, -0.2, 0]} color="#b45cff" p={p} />
    {[0, 1, 2].map((ring) => {
      const size = 0.5 + ((p * 2.4 + ring * 0.33) % 1) * 1.6;
      return (
        <mesh key={ring} position={[0.55, 1.3, -0.1]} rotation={[0, 0, 0]}>
          <torusGeometry args={[size, 0.012, 6, 40]} />
          <meshStandardMaterial color="#b45cff" emissive="#b45cff" emissiveIntensity={1.8} transparent opacity={0.7} />
        </mesh>
      );
    })}
    <pointLight position={[-1.8, 3.4, -1.4]} color="#ffd23d" intensity={22} distance={11} />
    <pointLight position={[0.5, 1.4, 1]} color="#b45cff" intensity={18} distance={7} />
  </group>
);

const StationScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[16, 16]} />
      <meshStandardMaterial color="#0a0e1a" />
    </mesh>
    <mesh position={[0, 1.05, -0.6]}>
      <boxGeometry args={[5.4, 1.1, 1]} />
      <meshStandardMaterial color="#2b3450" />
    </mesh>
    <mesh position={[0, 2.1, -0.9]}>
      <boxGeometry args={[5.4, 1.9, 0.08]} />
      <meshPhysicalMaterial color="#9fd8ff" transparent opacity={0.16} roughness={0.1} />
    </mesh>
    <Avatar position={[1.5, 1.1, -1.6]} rotation={[0, Math.PI, 0]} color="#2f3b5c" p={p} />
    <mesh position={[1.5, 2.5, -1.6]}>
      <boxGeometry args={[0.24, 0.24, 0.04]} />
      <meshStandardMaterial color="#6cf6ff" emissive="#6cf6ff" emissiveIntensity={2} />
    </mesh>
    <Avatar position={[-0.9, 0, 1.1]} rotation={[0, 0, 0]} color="#e0603c" p={p} jaw />
    <mesh position={[-0.2, 1.14, 0.1]} rotation={[-Math.PI / 2, 0, 0.1]}>
      <planeGeometry args={[0.9, 1.2]} />
      <meshStandardMaterial color="#e8f2ff" emissive="#6cf6ff" emissiveIntensity={0.25} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[1.1, 1.7 + Math.max(0, 0.5 - Math.abs(p - 0.72) * 4) * 1.2, -0.2]}>
      <boxGeometry args={[0.5, 0.24, 0.5]} />
      <meshStandardMaterial color="#1a1f30" metalness={0.6} roughness={0.3} />
    </mesh>
    <pointLight position={[0, 3.2, 0.4]} color="#6cf6ff" intensity={20} distance={10} />
    <pointLight position={[-2, 2, 2]} color="#ffd23d" intensity={10} distance={8} />
  </group>
);

const DoorScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[16, 16]} />
      <meshStandardMaterial color="#0a0d18" />
    </mesh>
    <mesh position={[0, 1.6, -2.6]}>
      <boxGeometry args={[3.4, 3.2, 0.3]} />
      <meshStandardMaterial color="#1a2034" />
    </mesh>
    <mesh position={[0.5, 1.6, -2.35]} rotation={[0, -0.5, 0]}>
      <boxGeometry args={[1.5, 3, 0.12]} />
      <meshStandardMaterial color="#2b3450" />
    </mesh>
    <mesh position={[0.95, 1.6, -2.0]}>
      <sphereGeometry args={[0.08, 10, 8]} />
      <meshStandardMaterial color="#ffd23d" emissive="#ffd23d" emissiveIntensity={1.6} />
    </mesh>
    {[0, 1, 2, 3].map((step) => {
      const reveal = clamp01((p - 0.18 - step * 0.12) * 5);
      return (
        <group key={step} position={[-0.9 + step * 0.42, 0.02, -0.6 - step * 0.55]} scale={reveal}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.22, 12]} />
            <meshStandardMaterial color="#7dffd0" emissive="#7dffd0" emissiveIntensity={1.8} />
          </mesh>
          <mesh position={[0.18, 0.01, -0.12]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.2, 12]} />
            <meshStandardMaterial color="#7dffd0" emissive="#7dffd0" emissiveIntensity={1.8} />
          </mesh>
        </group>
      );
    })}
    <Avatar
      position={[-1.5, 0, 0.4]}
      rotation={[0, 0.5, 0]}
      color="#e0603c"
      p={p}
      opacity={0.55 + Math.sin(p * 10) * 0.2}
    />
    <Avatar position={[-0.3, 0, -1.4]} rotation={[0, 0, 0]} color="#4a5bd8" p={p} jaw />
    <mesh position={[1.6, 0.9, -0.8]} rotation={[0, 0, 0.18]}>
      <cylinderGeometry args={[0.04, 0.04, 1.9, 6]} />
      <meshStandardMaterial color="#8a6a3c" />
    </mesh>
    <pointLight position={[0, 1.6, -1.6]} color="#7dffd0" intensity={22} distance={9} />
    <pointLight position={[-2, 2.4, 1]} color="#b45cff" intensity={12} distance={9} />
  </group>
);

const PostersScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, 2.2, -3.6]}>
      <boxGeometry args={[12, 5.6, 0.3]} />
      <meshStandardMaterial color="#171b2b" />
    </mesh>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18, 18]} />
      <meshStandardMaterial color="#0a0b14" />
    </mesh>
    {Array.from({length: 9}, (_, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const pop = clamp01((p - 0.1 - index * 0.055) * 6);
      return (
        <group
          key={index}
          position={[-2.6 + col * 2.6, 3.3 - row * 1.5, -3.35]}
          scale={0.2 + pop * 0.8}
          rotation={[0, 0, (hash(index) - 0.5) * 0.16]}
        >
          <mesh>
            <boxGeometry args={[1.5, 1.1, 0.04]} />
            <meshStandardMaterial color="#f2e9d0" emissive="#ffd23d" emissiveIntensity={0.22} />
          </mesh>
          <mesh position={[0, 0.22, 0.03]}>
            <sphereGeometry args={[0.2, 10, 8]} />
            <meshStandardMaterial color="#3a4058" />
          </mesh>
          <mesh position={[0, -0.16, 0.03]}>
            <boxGeometry args={[0.9, 0.08, 0.01]} />
            <meshStandardMaterial color="#3a4058" />
          </mesh>
        </group>
      );
    })}
    {[0, 1, 2, 3].map((index) => (
      <Avatar
        key={index}
        position={[-3 + index * 2, 0, 0.6 + hash(index) * 1.2]}
        rotation={[0, Math.PI + (hash(index + 9) - 0.5), 0]}
        color="#22283c"
        p={p}
        opacity={0.7}
      />
    ))}
    <Phone position={[1.4, 1.4, 1.2]} rotation={[0, -0.4, 0]} color="#ffd23d" p={p} />
    <pointLight position={[0, 3.4, 0]} color="#ffd23d" intensity={20} distance={13} />
  </group>
);

const PhotoScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[16, 16]} />
      <meshStandardMaterial color="#080910" />
    </mesh>
    <group position={[0, 1.9, -1.4]} rotation={[0, Math.sin(p * 2) * 0.08, 0]}>
      <mesh>
        <boxGeometry args={[3.2, 2.2, 0.08]} />
        <meshStandardMaterial color="#e8e2d2" emissive="#ff8ad4" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[2.9, 1.9]} />
        <meshStandardMaterial color="#1a2740" emissive="#ff8ad4" emissiveIntensity={0.2} />
      </mesh>
      <group position={[0, -0.35, 0.12]} scale={0.52}>
        <Horse position={[0, 0, 0]} color="#ffb84d" p={p} scale={0.8} />
      </group>
      <group position={[0, 1.05, 0.12]} scale={0.5}>
        <Avatar position={[0, 0, 0]} color="#4a5bd8" p={p} />
      </group>
      <mesh position={[-1.1, 0.72, 0.1]}>
        <boxGeometry args={[0.5, 0.08, 0.01]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
    </group>
    <ChatCard position={[-1.8, 1.1, 0.4]} color="#ff8ad4" p={p} seed={4} />
    <ChatCard position={[1.9, 2.6, 0.2]} color="#5ff7ff" p={p} seed={5} />
    <mesh position={[Math.sin(p * 3) * 1.2, 1.9, 0.5]} rotation={[0, 0, 0]}>
      <torusGeometry args={[0.42, 0.02, 8, 36]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
    </mesh>
    <pointLight position={[0, 2.2, 1.4]} color="#ff8ad4" intensity={20} distance={10} />
  </group>
);

const FieldScene: React.FC<{p: number}> = ({p}) => {
  const grass = useMemo(
    () =>
      Array.from({length: 90}, (_, index) => ({
        x: (hash(index) - 0.5) * 12,
        z: -6 + hash(index + 50) * 8,
        h: 0.5 + hash(index + 90) * 1.1,
      })),
    [],
  );
  const approach = clamp01((p - 0.35) / 0.6);
  return (
    <group>
      <mesh position={[0, -0.05, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#070a0c" />
      </mesh>
      {grass.map((blade, index) => (
        <mesh
          key={index}
          position={[blade.x, blade.h / 2, blade.z]}
          rotation={[Math.sin(p * 5 + index) * 0.12, 0, (hash(index + 7) - 0.5) * 0.2]}
        >
          <boxGeometry args={[0.035, blade.h, 0.035]} />
          <meshStandardMaterial color="#1c3a2a" emissive="#123024" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((index) => {
        const phase = (p * 2.2 + index * 0.25) % 1;
        return (
          <mesh key={index} position={[0, 0.02, -3.4 + index * 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[phase * 1.6, phase * 1.6 + 0.05, 40]} />
            <meshStandardMaterial color="#ff3d81" emissive="#ff3d81" emissiveIntensity={2} transparent opacity={0.8 - phase * 0.6} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      <Horse
        position={[0, 0, lerp(-9, -3.2, approach)]}
        color="#ff3d81"
        p={p}
        dark
        scale={lerp(0.7, 1.1, approach)}
      />
      <pointLight position={[0, 1.4, -3]} color="#ff3d81" intensity={18 + approach * 22} distance={12} />
      <pointLight position={[-3, 3, 2]} color="#5ff7ff" intensity={7} distance={12} />
    </group>
  );
};

const RevealScene: React.FC<{p: number}> = ({p}) => (
  <group>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#1a1c18" />
    </mesh>
    <mesh position={[-4, 4, -8]}>
      <sphereGeometry args={[1.6, 24, 18]} />
      <meshStandardMaterial color="#fff0c0" emissive="#ffb84d" emissiveIntensity={3} />
    </mesh>
    {[0, 1, 2].map((index) => {
      const phase = (p * 1.8 + index * 0.34) % 1;
      return (
        <mesh key={index} position={[0, 0.03, -1.4 + index * 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[phase * 1.5, phase * 1.5 + 0.06, 40]} />
          <meshStandardMaterial color="#ffb84d" emissive="#ffb84d" emissiveIntensity={2.2} transparent opacity={0.8 - phase * 0.6} side={THREE.DoubleSide} />
        </mesh>
      );
    })}
    <Horse position={[0.3, 0, -1.6]} rotation={[0, -0.15, 0]} color="#c98a4b" p={p} />
    <Avatar position={[0.3, 1.72, -1.55]} rotation={[0, -0.15, 0]} color="#4a5bd8" p={p} />
    <Avatar position={[-1.6, 0, 1.1]} rotation={[0, 0.35, 0]} color="#e0603c" p={p} jaw />
    <pointLight position={[0, 3, 0]} color="#ffb84d" intensity={30} distance={14} />
    <pointLight position={[-3, 2, 2]} color="#5ff7ff" intensity={10} distance={10} />
  </group>
);

const SceneContent: React.FC<{index: number; p: number}> = ({index, p}) => {
  switch (index) {
    case 0:
      return <BedroomScene p={p} />;
    case 1:
      return <StreetScene p={p} />;
    case 2:
      return <StationScene p={p} />;
    case 3:
      return <DoorScene p={p} />;
    case 4:
      return <PostersScene p={p} />;
    case 5:
      return <PhotoScene p={p} />;
    case 6:
      return <FieldScene p={p} />;
    case 7:
      return <RevealScene p={p} />;
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
      <color attach="background" args={['#05060c']} />
      <fog attach="fog" args={['#05060c', 8, 30]} />
      <FrameSync frame={frame} />
      <CameraRig index={index} p={p} />
      <ambientLight intensity={0.4} />
      <SceneContent index={index} p={p} />
      <Effects p={p} />
    </Canvas>
  );
};
