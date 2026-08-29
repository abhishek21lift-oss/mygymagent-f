"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function MiniIcon({ color, variant }: { color: string; variant: "up" | "down" | "neutral" }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.3;
    ref.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.8) * 0.2;
    ref.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
  });

  return (
    <mesh ref={ref}>
      {variant === "up" ? (
        <octahedronGeometry args={[0.4]} />
      ) : variant === "down" ? (
        <dodecahedronGeometry args={[0.4]} />
      ) : (
        <icosahedronGeometry args={[0.4]} />
      )}
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.7}
        roughness={0.2}
        metalness={0.5}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function MiniScene({ color, variant }: { color: string; variant: "up" | "down" | "neutral" }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.5], fov: 35 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 3]} intensity={0.8} />
      <MiniIcon color={color} variant={variant} />
    </Canvas>
  );
}

interface MetricCard3DProps {
  icon: typeof TrendingUp;
  label: string;
  value?: string | number;
  loading?: boolean;
  accent: "cyan" | "green" | "amber" | "violet" | "rose";
  hint?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  delay?: number;
}

const accents = {
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-600", color: "#06b6d4" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-600", color: "#10b981" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600", color: "#f59e0b" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-600", color: "#8b5cf6" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-600", color: "#f43f5e" },
};

export function MetricCard3D({
  icon: Icon,
  label,
  value,
  loading,
  accent,
  hint,
  trend = "neutral",
  trendValue,
  delay = 0,
}: MetricCard3DProps) {
  const accentStyle = accents[accent];
  const trendVariant = trend === "up" ? "up" : trend === "down" ? "down" : "neutral";

  return (
    <Card
      className="group relative overflow-hidden border-0 shadow-sm ring-1 ring-border/70 transition-all duration-500 hover:-translate-y-1 hover:ring-primary/25 hover:shadow-lg hover:shadow-primary/5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* 3D Icon area */}
          <div className="relative h-24 w-24 shrink-0 overflow-hidden">
            <div className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
              <MiniScene color={accentStyle.color} variant={trendVariant} />
            </div>
            <div className={`absolute inset-0 flex items-center justify-center`}>
              <span className={`flex size-10 items-center justify-center rounded-xl ${accentStyle.bg} ${accentStyle.text} backdrop-blur-sm`}>
                <Icon className="size-4.5" />
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-center px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              {hint && <span className="text-[10px] text-muted-foreground/70">{hint}</span>}
            </div>

            {loading ? (
              <div className="mt-1.5 h-7 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-semibold tracking-tight tabular-nums">{value ?? "—"}</p>
                {trendValue && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-muted-foreground"}`}>
                    {trend === "up" ? <TrendingUp className="size-3" /> : trend === "down" ? <TrendingDown className="size-3" /> : null}
                    {trendValue}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
