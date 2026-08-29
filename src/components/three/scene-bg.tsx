"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function FloatingShape({
  position,
  color,
  scale = 1,
  shape = "sphere",
  speed = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
  shape?: "sphere" | "box" | "torus" | "octahedron" | "cone";
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.3) * 0.4;
    ref.current.rotation.y += 0.002 * speed;
    ref.current.rotation.z = Math.cos(state.clock.elapsedTime * speed * 0.2) * 0.2;
  });

  const geometry = useMemo(() => {
    switch (shape) {
      case "box":
        return <boxGeometry args={[1, 1, 1]} />;
      case "torus":
        return <torusGeometry args={[0.7, 0.25, 16, 32]} />;
      case "octahedron":
        return <octahedronGeometry args={[0.7]} />;
      case "cone":
        return <coneGeometry args={[0.6, 1.2, 4]} />;
      default:
        return <sphereGeometry args={[0.6, 32, 32]} />;
    }
  }, [shape]);

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={ref} position={position} scale={scale} castShadow>
        {geometry}
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.35}
          roughness={0.2}
          metalness={0.5}
          distort={0.3}
          speed={speed * 2}
        />
      </mesh>
    </Float>
  );
}

function WorkoutDumbbell({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
    groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
      <group ref={groupRef} position={position} scale={0.35}>
        {/* Bar */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 3, 16]} />
          <meshStandardMaterial color="#818cf8" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Left weight */}
        <mesh position={[-1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
          <meshStandardMaterial color="#6366f1" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Right weight */}
        <mesh position={[1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
          <meshStandardMaterial color="#6366f1" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </Float>
  );
}

function PulseRings() {
  const ringsRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!ringsRef.current) return;
    const t = state.clock.elapsedTime;
    ringsRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const scale = 1 + ((t * 0.3 + i * 0.5) % 3) * 0.8;
      mesh.scale.set(scale, scale, scale);
      (mesh.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.3 - ((t * 0.3 + i * 0.5) % 3) * 0.1);
    });
  });

  return (
    <group ref={ringsRef} position={[0, 0, -2]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.6, 64]} />
          <meshStandardMaterial color="#818cf8" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

export function SceneBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#c7d2fe" />
        <directionalLight position={[-3, 2, 4]} intensity={0.4} color="#a78bfa" />
        <pointLight position={[0, 0, 3]} intensity={0.5} color="#818cf8" />

        <FloatingShape position={[-3.5, 1.5, -1]} color="#818cf8" shape="torus" scale={0.7} speed={0.8} />
        <FloatingShape position={[3, -1, -2]} color="#6366f1" shape="octahedron" scale={0.5} speed={1.2} />
        <FloatingShape position={[-2, -2, -1.5]} color="#a78bfa" shape="box" scale={0.4} speed={0.6} />
        <FloatingShape position={[2.5, 2, -3]} color="#c7d2fe" shape="sphere" scale={0.8} speed={0.9} />
        <FloatingShape position={[0, -2.5, -2]} color="#4f46e5" shape="cone" scale={0.35} speed={1.1} />
        <FloatingShape position={[-3, 2.5, -3]} color="#7c3aed" shape="sphere" scale={0.3} speed={1.4} />

        <WorkoutDumbbell position={[2, 1.5, -1]} />
        <PulseRings />
      </Canvas>
    </div>
  );
}
