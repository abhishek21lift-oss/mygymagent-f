"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import styles from "./landing.module.css";

/*
 * The landing page used to animate: sections faded in on scroll, cards
 * leaned toward the pointer and the hero scene followed it. On phones
 * that kept the main thread busy and the page stuttered, so these are
 * now plain wrappers -- same props, same markup, nothing moving -- and
 * the call sites did not have to change.
 */

/** A section that used to fade in on scroll. Now it simply renders. */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Ignored: kept so existing call sites stay valid. */
  delay?: number;
  as?: "div" | "li" | "section" | "article";
}) {
  return <Tag className={className}>{children}</Tag>;
}

/** A card that used to lean toward the pointer. */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/** The hero's 3D scene, held at one fixed angle. */
export function TiltStage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(styles.stage, className)} aria-hidden="true">
      <div className={styles.scene}>{children}</div>
    </div>
  );
}
