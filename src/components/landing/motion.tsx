"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import styles from "./landing.module.css";

/**
 * Fades its children in as they scroll into view. Rendered visible on the
 * server (no JS, crawlers, reduced motion), and only hidden once the
 * observer is running, so content is never stuck invisible.
 */
export function Reveal({
 children,
 className,
 delay = 0,
 as: Tag = "div",
}: {
 children: React.ReactNode;
 className?: string;
 delay?: number;
 as?: "div" | "li" | "section" | "article";
}) {
 const ref = React.useRef<HTMLElement>(null);
 const [state, setState] = React.useState<"idle" | "hidden" | "visible">("idle");

 React.useEffect(() => {
 const node = ref.current;
 if (!node || typeof IntersectionObserver === "undefined") return;
 if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
 // Already on screen at load: leave it be rather than blink it out and in.
 const rect = node.getBoundingClientRect();
 if (rect.top < window.innerHeight * 0.9) return;
 setState("hidden");
 const observer = new IntersectionObserver(
 (entries) => {
 if (entries.some((e) => e.isIntersecting)) {
 setState("visible");
 observer.disconnect();
 }
 },
 { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
 );
 observer.observe(node);
 return () => observer.disconnect();
 }, []);

 return (
 <Tag
 ref={ref as React.Ref<never>}
 className={cn(state !== "idle" && styles.reveal, className)}
 data-visible={state === "visible" ? "true" : "false"}
 style={{ "--delay": `${delay}ms` } as React.CSSProperties}
 >
 {children}
 </Tag>
 );
}

/** A card that leans toward the pointer, on devices that have one. */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
 const ref = React.useRef<HTMLDivElement>(null);
 const frame = React.useRef(0);

 function move(event: React.PointerEvent<HTMLDivElement>) {
 if (event.pointerType !== "mouse") return;
 const node = ref.current;
 if (!node) return;
 const rect = node.getBoundingClientRect();
 const x = (event.clientX - rect.left) / rect.width - 0.5;
 const y = (event.clientY - rect.top) / rect.height - 0.5;
 cancelAnimationFrame(frame.current);
 frame.current = requestAnimationFrame(() => {
 node.style.setProperty("--tx", `${(-y * 8).toFixed(2)}deg`);
 node.style.setProperty("--ty", `${(x * 10).toFixed(2)}deg`);
 });
 }
 function leave() {
 cancelAnimationFrame(frame.current);
 ref.current?.style.setProperty("--tx", "0deg");
 ref.current?.style.setProperty("--ty", "0deg");
 }

 return (
 <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={cn(styles.tilt, className)}>
 {children}
 </div>
 );
}

/**
 * The hero's 3D scene: follows the pointer on a desktop, sways on its own
 * on a phone. The scene itself is passed in, so it renders on the server.
 */
export function TiltStage({ children, className }: { children: React.ReactNode; className?: string }) {
 const scene = React.useRef<HTMLDivElement>(null);
 const frame = React.useRef(0);

 React.useEffect(() => {
 const node = scene.current;
 if (!node) return;
 const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
 const fine = window.matchMedia("(pointer: fine)");
 if (reduce.matches || !fine.matches) return;

 function onMove(event: PointerEvent) {
 const x = event.clientX / window.innerWidth - 0.5;
 const y = event.clientY / window.innerHeight - 0.5;
 cancelAnimationFrame(frame.current);
 frame.current = requestAnimationFrame(() => {
 node!.style.setProperty("--ry", `${(-16 + x * 14).toFixed(2)}deg`);
 node!.style.setProperty("--rx", `${(16 - y * 10).toFixed(2)}deg`);
 });
 }
 window.addEventListener("pointermove", onMove, { passive: true });
 return () => {
 window.removeEventListener("pointermove", onMove);
 cancelAnimationFrame(frame.current);
 };
 }, []);

 return (
 <div className={cn(styles.stage, className)} aria-hidden="true">
 <div className={styles.sway}>
 <div ref={scene} className={styles.scene}>
 {children}
 </div>
 </div>
 </div>
 );
}
