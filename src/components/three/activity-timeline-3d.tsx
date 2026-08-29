"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";

interface Activity {
  label: string;
  time: string;
  color: string;
  value: number; // 0-1 normalized
}

function TimelineNode({
  position,
  color,
  size,
  delay,
  label,
}: {
  position: [number, number, number];
  color: string;
  size: number;
  delay: number;
  label: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = Math.max(0, state.clock.elapsedTime - delay);
    const scale = Math.min(1, t / 0.8);
    const eased = 1 - Math.pow(1 - scale, 3);
    meshRef.current.scale.setScalar(size * eased);

    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2 + delay) * 0.1 + 0.9;
      glowRef.current.scale.setScalar(size * eased * pulse * 1.8);
    }
  });

  return (
    <group position={position}>
      {/* Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      {/* Node */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Label */}
      <Text
        position={[0, -1.8, 0]}
        fontSize={0.5}
        color="#94a3b8"
        anchorX="center"
        anchorY="top"
        maxWidth={3}
      >
        {label}
      </Text>
    </group>
  );
}

function TimelineLine({ length }: { length: number }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!ref.current) return;
    const progress = Math.min(1, state.clock.elapsedTime / 2);
    ref.current.scale.x = progress;
  });

  return (
    <mesh ref={ref} position={[0, 0, -0.1]}>
      <boxGeometry args={[length, 0.05, 0.05]} />
      <meshStandardMaterial color="#4f46e5" transparent opacity={0.3} />
    </mesh>
  );
}

export function ActivityTimeline3D({ activities }: { activities: Activity[] }) {
  const totalWidth = activities.length * 2;
  const startX = -totalWidth / 2 + 1;

  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 3, 5]} intensity={0.6} color="#c7d2fe" />
        <pointLight position={[0, 2, 3]} intensity={0.4} color="#818cf8" />

        <Float speed={0.3} rotationIntensity={0.05} floatIntensity={0.1}>
          <group rotation={[0.15, 0, 0]}>
            <TimelineLine length={totalWidth} />
            {activities.map((activity, i) => (
              <TimelineNode
                key={i}
                position={[startX + i * 2, activity.value * 0.8, 0]}
                color={activity.color}
                size={0.2 + activity.value * 0.15}
                delay={i * 0.15}
                label={activity.label}
              />
            ))}
          </group>
        </Float>

        <Sparkles count={20} scale={4} size={1} speed={0.3} color="#818cf8" opacity={0.3} />
      </Canvas>
    </div>
  );
}
