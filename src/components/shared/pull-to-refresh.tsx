"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** How far (after resistance) the content must travel to refresh. */
export const PULL_THRESHOLD = 72;
const MAX_PULL = 128;
/** A refresh that answers instantly still shows the spinner this long,
 * or the gesture feels like it did nothing. */
const MIN_SPIN_MS = 550;
const DONE_MS = 650;
const RING = 2 * Math.PI * 15;

type Phase = "idle" | "pulling" | "armed" | "refreshing" | "done";

type RefreshHandler = () => unknown;
const RefreshRegistry = React.createContext<((handler: RefreshHandler) => () => void) | null>(null);

/**
 * For a screen that loads its data itself rather than through React
 * Query: the pull runs `handler` too, and waits for it. Without this a
 * pull refetches every query on screen and leaves such a page as it was.
 */
export function useRefreshOnPull(handler: RefreshHandler) {
  const register = React.useContext(RefreshRegistry);
  const latest = React.useRef(handler);
  React.useEffect(() => {
    latest.current = handler;
  });
  React.useEffect(() => {
    if (!register) return;
    return register(() => latest.current());
  }, [register]);
}

/**
 * Finger travel to content travel: close to the finger at first, then
 * heavier the further you pull, the way iOS rubber-bands. About 115px of
 * finger travel reaches the threshold.
 */
export function resist(distance: number): number {
  if (distance <= 0) return 0;
  return Math.min(MAX_PULL, MAX_PULL * (1 - Math.exp(-distance / (MAX_PULL * 1.1))));
}

function scrollTopOf(target: HTMLElement | null): number {
  if (target) return target.scrollTop;
  return window.scrollY || document.documentElement.scrollTop || 0;
}

/** A dialog, sheet or menu is open: the pull belongs to it, not the page. */
function overlayOpen(): boolean {
  return Boolean(
    document.querySelector(
      '[role="dialog"][data-state="open"], [role="menu"][data-state="open"], [data-slot="popover-content"][data-state="open"]',
    ),
  );
}

/** Started on something that scrolls or drags on its own: a scrolled-down
 * inner list, a carousel, a signature pad, or anything opted out. */
function startsInsideOwnScroller(start: EventTarget | null, root: HTMLElement | null): boolean {
  let node = start instanceof Element ? start : null;
  while (node && node !== root && node !== document.body) {
    if (node instanceof HTMLElement) {
      if (node.dataset.ptrIgnore !== undefined) return true;
      if (node.isContentEditable || node.tagName === "CANVAS") return true;
      const style = window.getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight && node.scrollTop > 0) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

/**
 * Pull down from the top of the page to reload what it shows.
 *
 * The data on every screen comes from React Query, so a refresh is a
 * refetch of the queries on screen plus `router.refresh()` for anything
 * server-rendered -- the page stays put, with no white flash and no lost
 * scroll or form state, unlike reloading the tab.
 *
 * Touch only: a mouse or trackpad never starts it. It stands aside when
 * the page isn't at the very top, when a dialog or menu is open, when the
 * gesture is sideways, and inside anything that scrolls or drags on its
 * own (or carries `data-ptr-ignore`).
 *
 * `scrollRef` is the element that scrolls; without it, the window.
 */
export function PullToRefresh({
  children,
  scrollRef,
  onRefresh,
  className,
}: {
  children: React.ReactNode;
  scrollRef?: React.RefObject<HTMLElement | null>;
  onRefresh?: () => Promise<unknown>;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const indicatorRef = React.useRef<HTMLDivElement | null>(null);
  const ringRef = React.useRef<SVGCircleElement | null>(null);
  const arrowRef = React.useRef<HTMLSpanElement | null>(null);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const phaseRef = React.useRef<Phase>("idle");
  const [top, setTop] = React.useState(0);

  const handlers = React.useRef(new Set<RefreshHandler>());
  const register = React.useCallback((handler: RefreshHandler) => {
    handlers.current.add(handler);
    return () => {
      handlers.current.delete(handler);
    };
  }, []);

  const refresh = React.useCallback(async () => {
    if (onRefresh) return onRefresh();
    router.refresh();
    await Promise.allSettled([
      queryClient.refetchQueries({ type: "active" }),
      ...[...handlers.current].map((handler) => Promise.resolve().then(handler)),
    ]);
  }, [onRefresh, queryClient, router]);

  const setPhaseBoth = React.useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  React.useEffect(() => {
    const target = scrollRef?.current ?? null;
    const eventTarget: HTMLElement | Window = target ?? window;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Chrome on Android reloads the whole tab on its own pull at the top
    // of the document. This one replaces it, so the browser's is turned
    // off while mounted.
    const root = document.documentElement;
    const previousOverscroll = root.style.overscrollBehaviorY;
    if (!target) root.style.overscrollBehaviorY = "contain";

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let decided = false;
    let pull = 0;
    let frame = 0;
    let buzzed = false;

    const paint = (distance: number, animate: boolean) => {
      const content = contentRef.current;
      const indicator = indicatorRef.current;
      const transition = animate ? "transform 380ms cubic-bezier(0.22,1,0.36,1), opacity 240ms ease" : "none";
      if (content && !reduceMotion) {
        content.style.transition = transition;
        content.style.transform = distance > 0 ? `translate3d(0, ${distance}px, 0)` : "";
      }
      if (indicator) {
        const progress = Math.min(1, distance / PULL_THRESHOLD);
        indicator.style.transition = transition;
        indicator.style.opacity = distance > 4 ? String(Math.min(1, progress * 1.4)) : "0";
        indicator.style.transform = `translate3d(-50%, ${Math.max(0, distance - 52)}px, 0) scale(${0.6 + progress * 0.4})`;
        if (ringRef.current) ringRef.current.style.strokeDashoffset = String(RING * (1 - progress));
        if (arrowRef.current) arrowRef.current.style.transform = `rotate(${progress >= 1 ? 180 : progress * 150}deg)`;
      }
    };

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const busy = phaseRef.current === "refreshing" || phaseRef.current === "done";
      if (busy || scrollTopOf(target) > 0 || overlayOpen()) return;
      if (startsInsideOwnScroller(event.target, target)) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      tracking = true;
      decided = false;
      buzzed = false;
      pull = 0;
      const nextTop = target ? target.getBoundingClientRect().top : 0;
      setTop((current) => (current === nextTop ? current : nextTop));
    };

    const onMove = (event: TouchEvent) => {
      if (!tracking) return;
      const dx = event.touches[0].clientX - startX;
      const dy = event.touches[0].clientY - startY;
      if (!decided) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        // Sideways, or scrolling down the page: not a pull.
        if (Math.abs(dx) > Math.abs(dy) || dy < 0 || scrollTopOf(target) > 0) {
          tracking = false;
          return;
        }
        decided = true;
        setPhaseBoth("pulling");
      }
      if (event.cancelable) event.preventDefault();
      pull = resist(dy);
      const armed = pull >= PULL_THRESHOLD;
      if (armed && !buzzed) {
        buzzed = true;
        navigator.vibrate?.(8);
      }
      if (armed !== (phaseRef.current === "armed")) setPhaseBoth(armed ? "armed" : "pulling");
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => paint(pull, false));
    };

    const onEnd = async () => {
      if (!tracking) return;
      tracking = false;
      cancelAnimationFrame(frame);
      if (!decided) return;
      if (pull < PULL_THRESHOLD) {
        setPhaseBoth("idle");
        paint(0, true);
        return;
      }
      setPhaseBoth("refreshing");
      paint(PULL_THRESHOLD * 0.78, true);
      const started = Date.now();
      try {
        await refresh();
      } catch {
        // A failed query shows its own error state; the gesture still ends.
      }
      const wait = Math.max(0, MIN_SPIN_MS - (Date.now() - started));
      window.setTimeout(() => {
        setPhaseBoth("done");
        window.setTimeout(() => {
          setPhaseBoth("idle");
          paint(0, true);
        }, DONE_MS);
      }, wait);
    };

    const passive = { passive: true } as const;
    eventTarget.addEventListener("touchstart", onStart as EventListener, passive);
    eventTarget.addEventListener("touchmove", onMove as EventListener, { passive: false });
    eventTarget.addEventListener("touchend", onEnd as EventListener, passive);
    eventTarget.addEventListener("touchcancel", onEnd as EventListener, passive);
    return () => {
      cancelAnimationFrame(frame);
      eventTarget.removeEventListener("touchstart", onStart as EventListener);
      eventTarget.removeEventListener("touchmove", onMove as EventListener);
      eventTarget.removeEventListener("touchend", onEnd as EventListener);
      eventTarget.removeEventListener("touchcancel", onEnd as EventListener);
      if (!target) root.style.overscrollBehaviorY = previousOverscroll;
    };
  }, [scrollRef, refresh, setPhaseBoth]);

  const spinning = phase === "refreshing";
  const done = phase === "done";

  return (
    <>
      <div
        ref={indicatorRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 z-40 opacity-0"
        style={{ top: top + 10, transform: "translate3d(-50%, -40px, 0) scale(0.6)" }}
      >
        <div
          className={cn(
            "glass relative flex size-11 items-center justify-center rounded-full shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--section)_70%,transparent)] ring-1 ring-black/5",
            phase === "armed" && "scale-105",
          )}
          style={{ transition: "transform 200ms cubic-bezier(0.22,1,0.36,1)" }}
        >
          <svg viewBox="0 0 36 36" className={cn("absolute inset-0 size-11 -rotate-90", spinning && "animate-spin motion-reduce:animate-none")}>
            <defs>
              <linearGradient id="ptr-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--section-grad-1, var(--primary))" />
                <stop offset="100%" stopColor="var(--section-grad-2, var(--primary))" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="15" fill="none" strokeWidth="2.5" className="stroke-current opacity-10" />
            <circle
              ref={ringRef}
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="url(#ptr-ring)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={spinning ? `${RING * 0.28} ${RING}` : RING}
              strokeDashoffset={spinning ? 0 : RING}
            />
          </svg>
          {done ? (
            <Check className="size-4 animate-in zoom-in-50 duration-200" style={{ color: "var(--section-ink, var(--primary))" }} />
          ) : (
            <span
              ref={arrowRef}
              className={cn("flex transition-transform duration-200", spinning && "opacity-0")}
              style={{ color: "var(--section-ink, var(--primary))" }}
            >
              <ArrowDown className="size-4" strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {spinning ? "Refreshing" : done ? "Updated" : ""}
      </span>
      {/* No standing transform or will-change: either makes this the
          containing block for every position:fixed thing on the page. */}
      <div ref={contentRef} className={className}>
        <RefreshRegistry.Provider value={register}>{children}</RefreshRegistry.Provider>
      </div>
    </>
  );
}
