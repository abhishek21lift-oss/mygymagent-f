"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function MembershipOrb({ data }: { data: { label: string; value: number; color: string }[] }) {
  const groupRef = useRef<THREE.Group>(null!);
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const orbRef = useRef<THREE.Mesh>(null!);
  const ringsRef = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.003;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* Core orb */}
        <mesh ref={orbRef}>
          <sphereGeometry args={[0.8, 64, 64]} />
          <MeshDistortMaterial
            color="#6366f1"
            transparent
            opacity={0.4}
            roughness={0.1}
            metalness={0.6}
            distort={0.2}
            speed={2}
          />
        </mesh>

        {/* Inner glow */}
        <mesh>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color="#818cf8" transparent opacity={0.2} emissive="#818cf8" emissiveIntensity={0.5} />
        </mesh>

        {/* Data rings */}
        {data.map((item, i) => {
          const angle = (item.value / total) * Math.PI * 2;
          const radius = 1.2 + i * 0.25;
          return (
            <group key={i}>
              <mesh
                rotation={[Math.PI / 2, 0, i * 0.5]}
                ref={(el) => {
                  if (el) ringsRef.current[i] = el;
                }}
              >
                <torusGeometry args={[radius, 0.03, 8, 64, angle]} />
                <meshStandardMaterial
                  color={item.color}
                  emissive={item.color}
                  emissiveIntensity={0.4}
                  transparent
                  opacity={0.8}
                  roughness={0.1}
                  metalness={0.5}
                />
              </mesh>
            </group>
          );
        })}

        {/* Sparkles */}
        <Sparkles count={30} scale={3} size={1.5} speed={0.5} color="#818cf8" opacity={0.5} />
      </group>
    </Float>
  );
}

export function DataOrb({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 3, 5]} intensity={0.8} color="#c7d2fe" />
        <pointLight position={[0, 0, 3]} intensity={0.6} color="#818cf8" />
        <pointLight position={[-2, 2, 2]} intensity={0.3} color="#a78bfa" />

        <MembershipOrb data={data} />
      </Canvas>
    </div>
  );
}
