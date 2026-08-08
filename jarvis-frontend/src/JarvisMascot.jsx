import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Icosahedron,
  Torus,
  Sphere,
  Sparkles,
  Environment,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const ACCENT = "#8B7CFF"; // violet
const GLOW2 = "#22D3EE"; // sky-cyan

function Core({ audioLevelRef }) {
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
        color={ACCENT}
        emissive={ACCENT}
        emissiveIntensity={1.35}
        roughness={0.15}
        metalness={0.6}
      />
    </mesh>
  );
}

function Nucleus({ audioLevelRef }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const level = audioLevelRef?.current || 0;
    const s = 0.55 + Math.sin(t * 2.2) * 0.04 + level * 0.18;
    if (ref.current) ref.current.scale.setScalar(s);
  });
  return (
    <Sphere ref={ref} args={[1, 32, 32]}>
      <meshBasicMaterial color={GLOW2} toneMapped={false} />
    </Sphere>
  );
}

function Shell() {
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
      <meshBasicMaterial color={GLOW2} wireframe transparent opacity={0.22} />
    </Icosahedron>
  );
}

function Rings() {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) ref.current.rotation.z = t * 0.15;
  });
  return (
    <group ref={ref}>
      <Torus args={[2.15, 0.012, 12, 128]} rotation={[Math.PI / 2.5, 0, 0]}>
        <meshBasicMaterial color={ACCENT} transparent opacity={0.7} toneMapped={false} />
      </Torus>
      <Torus args={[2.45, 0.01, 12, 128]} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
        <meshBasicMaterial color={GLOW2} transparent opacity={0.5} toneMapped={false} />
      </Torus>
    </group>
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

function Scene({ audioLevelRef }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={40} color={ACCENT} />
      <pointLight position={[-4, -2, 3]} intensity={30} color={GLOW2} />
      <Environment preset="night" />

      <Rig>
        <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.9}>
          <Nucleus audioLevelRef={audioLevelRef} />
          <Core audioLevelRef={audioLevelRef} />
          <Shell />
          <Rings />
        </Float>

        <Orbiter radius={2.15} speed={0.9} offset={0} tilt={0.1} color={GLOW2} size={0.055} />
        <Orbiter radius={2.4} speed={-0.7} offset={2.1} tilt={-0.2} color={ACCENT} size={0.07} />
        <Orbiter radius={1.95} speed={1.15} offset={4.2} tilt={0.3} color={"#ffffff"} size={0.04} />

        <Sparkles
          count={50}
          scale={[7, 7, 7]}
          size={2.5}
          speed={0.35}
          opacity={0.6}
          color={GLOW2}
        />
      </Rig>

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

export default function JarvisMascot({ className = "", audioLevelRef }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene audioLevelRef={audioLevelRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}