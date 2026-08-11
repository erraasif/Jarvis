import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Icosahedron,
  Torus,
  Sphere,
  Sparkles,
  Environment,
  RoundedBox,
  Cylinder,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const PALETTES = {
  // Landing page: violet-dominant core, cyan shell/rings.
  core: { primary: "#8B7CFF", secondary: "#22D3EE" },
  // Voice Mode: cyan-dominant core, violet shell/rings -- a real color
  // inversion, not a copy-paste of the landing mascot, plus no orbit
  // rings so it reads as a focused "listening" presence rather than the
  // busier "gyroscope" landing hero.
  voice: { primary: "#22D3EE", secondary: "#8B7CFF" },
};

function Core({ audioLevelRef, primary }) {
  const meshRef = useRef();
  const original = useRef(null);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 3), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const geom = meshRef.current?.geometry;
    if (!geom) return;

    const pos = geom.attributes.position;
    if (!original.current) {
      original.current = pos.array.slice(0);
    }
    const base = original.current;
    const level = audioLevelRef?.current || 0;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
      const n = v.clone().normalize();
      const d =
        (0.12 + level * 0.12) * Math.sin(n.x * 4 + t * 1.4) +
        (0.1 + level * 0.1) * Math.sin(n.y * 5 - t * 1.1) +
        0.08 * Math.sin(n.z * 6 + t * 1.7);
      const scale = 1 + d;
      pos.setXYZ(i, n.x * scale, n.y * scale, n.z * scale);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();

    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.25;
      meshRef.current.rotation.x = t * 0.12;
      meshRef.current.material.emissiveIntensity = 1.35 + level * 1.2;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={primary}
        emissive={primary}
        emissiveIntensity={1.35}
        roughness={0.15}
        metalness={0.6}
      />
    </mesh>
  );
}

function Nucleus({ audioLevelRef, secondary }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const level = audioLevelRef?.current || 0;
    const s = 0.55 + Math.sin(t * 2.2) * 0.04 + level * 0.18;
    if (ref.current) ref.current.scale.setScalar(s);
  });
  return (
    <Sphere ref={ref} args={[1, 32, 32]}>
      <meshBasicMaterial color={secondary} toneMapped={false} />
    </Sphere>
  );
}

function Shell({ secondary }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y = -t * 0.18;
      ref.current.rotation.z = t * 0.1;
    }
  });
  return (
    <Icosahedron ref={ref} args={[1.7, 1]}>
      <meshBasicMaterial color={secondary} wireframe transparent opacity={0.22} />
    </Icosahedron>
  );
}

function Rings({ primary, secondary }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) ref.current.rotation.z = t * 0.15;
  });
  return (
    <group ref={ref}>
      <Torus args={[2.15, 0.012, 12, 128]} rotation={[Math.PI / 2.5, 0, 0]}>
        <meshBasicMaterial color={primary} transparent opacity={0.7} toneMapped={false} />
      </Torus>
      <Torus args={[2.45, 0.01, 12, 128]} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
        <meshBasicMaterial color={secondary} transparent opacity={0.5} toneMapped={false} />
      </Torus>
    </group>
  );
}

function RobotHead({ audioLevelRef, primary, secondary }) {
  const headRef = useRef();
  const visorRef = useRef();
  const visorMatRef = useRef();
  const eyeLRef = useRef();
  const eyeRRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const level = audioLevelRef?.current || 0;

    // Idle head bob/turn -- reads as "alive" even when silent.
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.12;
      headRef.current.position.y = Math.sin(t * 1.1) * 0.04;
    }

    // The visor is the one thing that's genuinely, functionally audio-reactive:
    // it widens and brightens with real voice level, like a live VU meter
    // built into the face, not decoration.
    if (visorRef.current) {
      const width = 1 + level * 0.35;
      visorRef.current.scale.x = width;
    }
    if (visorMatRef.current) {
      visorMatRef.current.emissiveIntensity = 1.1 + level * 2.2;
    }
    if (eyeLRef.current && eyeRRef.current) {
      const pulse = 1 + Math.sin(t * 3) * 0.06 + level * 0.3;
      eyeLRef.current.scale.setScalar(pulse);
      eyeRRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={headRef}>
      {/* Head shell */}
      <RoundedBox args={[1.7, 1.4, 1.5]} radius={0.28} smoothness={4}>
        <meshStandardMaterial color="#1a1826" metalness={0.75} roughness={0.3} />
      </RoundedBox>

      {/* Visor -- the audio-reactive face */}
      <group position={[0, 0.05, 0.72]}>
        <mesh ref={visorRef}>
          <boxGeometry args={[1.1, 0.32, 0.08]} />
          <meshStandardMaterial
            ref={visorMatRef}
            color={primary}
            emissive={primary}
            emissiveIntensity={1.1}
            toneMapped={false}
          />
        </mesh>
        <Sphere ref={eyeLRef} args={[0.07, 16, 16]} position={[-0.32, 0, 0.06]}>
          <meshBasicMaterial color={secondary} toneMapped={false} />
        </Sphere>
        <Sphere ref={eyeRRef} args={[0.07, 16, 16]} position={[0.32, 0, 0.06]}>
          <meshBasicMaterial color={secondary} toneMapped={false} />
        </Sphere>
      </group>

      {/* Side panels */}
      <RoundedBox args={[0.12, 0.7, 0.5]} radius={0.05} position={[-0.95, -0.05, 0]}>
        <meshStandardMaterial color={secondary} metalness={0.6} roughness={0.35} transparent opacity={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.12, 0.7, 0.5]} radius={0.05} position={[0.95, -0.05, 0]}>
        <meshStandardMaterial color={secondary} metalness={0.6} roughness={0.35} transparent opacity={0.85} />
      </RoundedBox>

      {/* Antenna */}
      <Cylinder args={[0.02, 0.02, 0.5, 8]} position={[0, 0.95, 0]}>
        <meshStandardMaterial color="#2a2740" metalness={0.7} roughness={0.3} />
      </Cylinder>
      <Sphere args={[0.06, 12, 12]} position={[0, 1.22, 0]}>
        <meshBasicMaterial color={primary} toneMapped={false} />
      </Sphere>

      {/* Jaw line detail */}
      <mesh position={[0, -0.62, 0.6]}>
        <boxGeometry args={[0.9, 0.05, 0.05]} />
        <meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

function RobotScanRing({ primary }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) ref.current.rotation.z = t * 0.3;
  });
  return (
    <Torus ref={ref} args={[1.55, 0.008, 8, 64]} rotation={[Math.PI / 2, 0, 0]}>
      <meshBasicMaterial color={primary} transparent opacity={0.35} toneMapped={false} />
    </Torus>
  );
}

function Orbiter({ radius, speed, offset, tilt, color, size }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + offset;
    if (ref.current) {
      ref.current.position.set(
        Math.cos(t) * radius,
        Math.sin(t * 0.8) * radius * 0.35 + tilt,
        Math.sin(t) * radius
      );
    }
  });
  return (
    <Sphere ref={ref} args={[size, 16, 16]}>
      <meshBasicMaterial color={color} toneMapped={false} />
    </Sphere>
  );
}

function Rig({ children }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      state.pointer.x * 0.35,
      0.05
    );
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      -state.pointer.y * 0.25,
      0.05
    );
  });
  return <group ref={ref}>{children}</group>;
}

function Scene({ audioLevelRef, variant }) {
  const { primary, secondary } = PALETTES[variant] || PALETTES.core;
  const isVoice = variant === "voice";

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={40} color={primary} />
      <pointLight position={[-4, -2, 3]} intensity={30} color={secondary} />
      <Environment preset="night" />

      {isVoice ? (
        <Rig>
          <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.5}>
            <RobotHead audioLevelRef={audioLevelRef} primary={primary} secondary={secondary} />
          </Float>
          <RobotScanRing primary={primary} />
          <Sparkles count={30} scale={[5, 5, 5]} size={2} speed={0.25} opacity={0.4} color={secondary} />
        </Rig>
      ) : (
        <Rig>
          <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.9}>
            <Nucleus audioLevelRef={audioLevelRef} secondary={secondary} />
            <Core audioLevelRef={audioLevelRef} primary={primary} />
            <Shell secondary={secondary} />
            <Rings primary={primary} secondary={secondary} />
          </Float>

          <Orbiter radius={2.15} speed={0.9} offset={0} tilt={0.1} color={secondary} size={0.055} />
          <Orbiter radius={2.4} speed={-0.7} offset={2.1} tilt={-0.2} color={primary} size={0.07} />
          <Orbiter radius={1.95} speed={1.15} offset={4.2} tilt={0.3} color={"#ffffff"} size={0.04} />

          <Sparkles
            count={50}
            scale={[7, 7, 7]}
            size={2.5}
            speed={0.35}
            opacity={0.6}
            color={secondary}
          />
        </Rig>
      )}

      <EffectComposer>
        <Bloom
          intensity={1.15}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.7}
        />
      </EffectComposer>
    </>
  );
}

export default function JarvisMascot({ className = "", audioLevelRef, variant = "core" }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene audioLevelRef={audioLevelRef} variant={variant} />
        </Suspense>
      </Canvas>
    </div>
  );
}