"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import * as THREE from "three";

function AnimatedBar({
  position,
  height,
  color,
  label,
  delay,
  maxHeight = 4,
}: {
  position: [number, number, number];
  height: number;
  color: string;
  label: string;
  delay: number;
  maxHeight?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const targetHeight = (height / maxHeight) * 3.5;
  const currentHeight = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;
    const elapsed = Math.max(0, state.clock.elapsedTime - delay);
    const progress = Math.min(1, elapsed / 1.2);
    const eased = 1 - Math.pow(1 - progress, 4); // ease-out quart

    currentHeight.current = targetHeight * eased;
    meshRef.current.scale.y = Math.max(0.001, currentHeight.current);
    meshRef.current.position.y = currentHeight.current / 2;
  });

  return (
    <group position={position}>
      {/* Bar */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.6, 1, 0.6]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.85}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      {/* Glow */}
      <pointLight position={[0, 1.5, 0.5]} intensity={0.3} color={color} distance={3} />
      {/* Label */}
      <Text
        position={[0, -0.4, 0]}
        fontSize={0.18}
        color="#94a3b8"
        anchorX="center"
        anchorY="top"
        font="/fonts/inter.woff"
      >
        {label}
      </Text>
    </group>
  );
}

function WeeklyBars({ data }: { data: { day: string; value: number }[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalWidth = data.length * 1;
  const startX = -totalWidth / 2 + 0.5;

  return (
    <>
      {data.map((item, i) => (
        <AnimatedBar
          key={item.day}
          position={[startX + i * 1, 0, 0]}
          height={item.value}
          maxHeight={maxValue}
          color={i === data.length - 1 ? "#818cf8" : "#6366f1"}
          label={item.day}
          delay={i * 0.1}
        />
      ))}
      {/* Grid lines */}
      {[0.5, 1, 1.5, 2].map((y) => (
        <mesh key={y} position={[0, y * 2, -0.3]}>
          <planeGeometry args={[totalWidth + 0.5, 0.01]} />
          <meshBasicMaterial color="#334155" transparent opacity={0.3} />
        </mesh>
      ))}
    </>
  );
}

export function Chart3D({
  data,
}: {
  data: { day: string; value: number }[];
}) {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 2, 6], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 3]} intensity={0.7} color="#c7d2fe" />
        <pointLight position={[-2, 3, 2]} intensity={0.4} color="#818cf8" />

        <Float speed={0.5} rotationIntensity={0.05} floatIntensity={0.1}>
          <group rotation={[0.1, -0.2, 0]}>
            <WeeklyBars data={data} />
          </group>
        </Float>
      </Canvas>
    </div>
  );
}
