import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "../analytics";
import {
  createMotion,
  dragBy,
  type Motion,
  nudge,
  release,
  resetTo,
  step,
  zoomBy,
} from "../globe/controller";
import { centerOn, project, projectPoster, type Screen, type View } from "../globe/project";
import { Receipt, type ReceiptData } from "./Receipt";

/**
 * The interactive globe. The static poster ships first and is all a visitor gets without WebGL.
 * On a capable device cobe (5.7 KB gzipped) loads after first paint and takes over the same
 * picture: drag to turn it (with inertia), pinch, ctrl or cmd plus wheel or the buttons to zoom,
 * a reset button, arrow keys and + and - from the keyboard. A vertical swipe or a plain wheel
 * still scrolls the page. Every marker is a real button, on the poster and on the live globe, and
 * opens that question's pending receipt, which ends in "Make your call" (the waitlist field).
 *
 * Reduced motion, save-data and a weak device do not load it on their own; the visitor can ask
 * for it, and under reduced motion it never spins and never coasts. No marker shows anything
 * but an upcoming question and its pending state.
 */

// Poster centre (scripts/gen_globe_poster.py): the live globe starts on the same view.
const HOME = centerOn(25, -35, 1.2); // sphere fills the poster's 0.96 of the box
const BASE_SIZE = 0.05;
const PULSE_PEAK = 0.065;
const PULSE_START_MS = 600;
const PULSE_STAGGER_MS = 900;
const PULSE_LENGTH_MS = 1600;
const KEY_STEP = 0.12;

export function pulseSize(i: number, elapsedMs: number): number {
  const local = elapsedMs - PULSE_START_MS - i * PULSE_STAGGER_MS;
  if (local <= 0 || local >= PULSE_LENGTH_MS) return BASE_SIZE;
  return BASE_SIZE + PULSE_PEAK * Math.sin((Math.PI * local) / PULSE_LENGTH_MS);
}

const now = () => performance.now();

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

/** Why the live globe is not loaded on its own, or null when it may be. */
export function holdBackReason(): "reduced_motion" | "save_data" | "weak_device" | null {
  if (prefersReducedMotion()) return "reduced_motion";
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return "save_data";
  if ((nav.deviceMemory ?? 8) < 2 || (navigator.hardwareConcurrency ?? 4) < 2) return "weak_device";
  return null;
}

// The cobe land dots and markers in token-derived colours. cobe wants 0..1 RGB.
function cssRgb01(varName: string, fallback: [number, number, number]): [number, number, number] {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    const m = v.match(/#([0-9a-f]{6})/i);
    if (m) {
      const n = Number.parseInt(m[1], 16);
      return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
  } catch {
    /* fall through */
  }
  return fallback;
}

type Live = { update: (s: Record<string, unknown>) => void; destroy: () => void };
type Input = "pointer" | "keyboard";

export function Globe({
  receipts,
  onJoin,
}: {
  receipts: ReceiptData[];
  /** Called from a receipt's "Make your call": focus the waitlist field. */
  onJoin: (location: string) => void;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const motion = useRef<Motion>(createMotion(HOME));
  const kick = useRef<() => void>(() => {});
  const reducedRef = useRef(false);
  const reported = useRef({ dragged: false, zoomed: false });
  const lastMarker = useRef<HTMLButtonElement | null>(null);
  // The idle spin waits while the pointer or focus is on the globe or a receipt is open.
  const hovering = useRef(false);
  const focused = useRef(false);
  const cardOpen = useRef(false);
  const spinPaused = useRef(false);
  const refreshPause = () => {
    spinPaused.current = hovering.current || focused.current || cardOpen.current;
  };

  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);
  const [hold, setHold] = useState<ReturnType<typeof holdBackReason>>(null);
  const [canGL, setCanGL] = useState(false);
  const [wanted, setWanted] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Decide once, after mount, what this visitor gets. Nothing heavy is loaded before this.
  useEffect(() => {
    const reason = holdBackReason();
    reducedRef.current = prefersReducedMotion();
    const gl = hasWebGL();
    setCanGL(gl);
    setHold(reason);
    if (gl && reason === null) setWanted(true);
  }, []);

  // Place every marker. On the poster it is a fixed projection; live, it follows the globe.
  const place = useCallback(
    (view: View | null) => {
      receipts.forEach((r, i) => {
        const el = markerRefs.current[i];
        if (!el) return;
        const p: Screen = view
          ? project(r.marker.lat, r.marker.lng, view)
          : projectPoster(r.marker.lat, r.marker.lng);
        const inside = p.x >= 0.02 && p.x <= 0.98 && p.y >= 0.02 && p.y <= 0.98;
        const show = p.visible && inside;
        if (el.hidden === show) el.hidden = !show;
        el.style.left = `${p.x * 100}%`;
        el.style.top = `${p.y * 100}%`;
      });
    },
    [receipts],
  );

  // The poster view: markers on the picture as soon as there is JavaScript.
  useEffect(() => {
    if (!live) place(null);
  }, [live, place]);

  // The live globe.
  // biome-ignore lint/correctness/useExhaustiveDependencies: set up once when asked for; receipts and place are stable for the page's life
  useEffect(() => {
    if (!wanted) return;
    const canvas = canvasRef.current;
    const holder = holderRef.current;
    if (!canvas || !holder) return;
    let destroyed = false;
    let globe: Live | null = null;
    let frame = 0;
    let onScreen = true;
    let last = 0;
    let started = 0;
    const opts = { reduced: reducedRef.current };
    const m = motion.current;

    const loop = (now: number) => {
      if (!globe) return;
      const dt = Math.min(64, last ? now - last : 16);
      last = now;
      const moving = step(m, dt, now, { ...opts, paused: spinPaused.current });
      const elapsed = now - started;
      const pulsing =
        !opts.reduced &&
        elapsed < PULSE_START_MS + receipts.length * PULSE_STAGGER_MS + PULSE_LENGTH_MS;
      globe.update({
        phi: m.phi,
        theta: m.theta,
        scale: m.scale,
        ...(pulsing
          ? {
              markers: receipts.map((r, i) => ({
                location: [r.marker.lat, r.marker.lng] as [number, number],
                size: pulseSize(i, elapsed),
              })),
            }
          : {}),
      });
      place(m);
      // Reduced motion draws only while something moves; otherwise the loop runs while visible.
      if (moving || pulsing || !opts.reduced) frame = requestAnimationFrame(loop);
      else frame = 0;
    };
    const start = () => {
      if (!globe || frame || !onScreen || document.hidden) return;
      last = 0;
      frame = requestAnimationFrame(loop);
    };
    kick.current = start;

    const create = () =>
      import("cobe").then(({ default: createGlobe }) => {
        if (destroyed || globe) return;
        const size = holder.clientWidth;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
        globe = createGlobe(canvas, {
          devicePixelRatio: dpr,
          width: size * dpr,
          height: size * dpr,
          phi: m.phi,
          theta: m.theta,
          scale: m.scale,
          // The same quiet picture as the poster: a pale sphere, green land dots, clay markers.
          dark: dark ? 0.55 : 0,
          diffuse: dark ? 1.1 : 1.4,
          mapSamples: 14000,
          mapBrightness: dark ? 14 : 3,
          mapBaseBrightness: 0,
          baseColor: dark ? [0.22, 0.34, 0.28] : [0.78, 0.89, 0.82],
          markerColor: cssRgb01("--accent-2", [0.7, 0.23, 0.18]),
          glowColor: cssRgb01("--paper", [0.95, 0.96, 0.95]),
          opacity: 1,
          markerElevation: 0.05,
          markers: receipts.map((r) => ({
            location: [r.marker.lat, r.marker.lng] as [number, number],
            size: BASE_SIZE,
          })),
        });
        started = performance.now();
        setLive(true);
        setReady(true);
        track("globe_ready", {});
        place(m);
        start();
      });

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      globe?.destroy();
      globe = null;
    };

    // After first paint, never during it.
    const raf = requestAnimationFrame(() => {
      void create();
    });
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (!onScreen) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else if (!globe) void create();
        else start();
      },
      { threshold: 0.05 },
    );
    io.observe(holder);
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // A new size means a new canvas: rebuild at the new size, keeping the view.
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!globe) return;
        stop();
        void create();
      }, 150);
    });
    ro.observe(holder);

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [wanted]);

  const opts = () => ({ reduced: reducedRef.current });

  // Each interaction is reported once per page view, with how it was done.
  const reportDrag = useCallback((input: string) => {
    if (reported.current.dragged) return;
    reported.current.dragged = true;
    track("globe_dragged", { input });
  }, []);
  const reportZoom = useCallback((input: string) => {
    if (reported.current.zoomed) return;
    reported.current.zoomed = true;
    track("globe_zoomed", { input });
  }, []);

  // Pointers: one finger or the mouse turns the globe; two fingers pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ lastT: 0, moved: 0, pinch: 0 });

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!live || (e.target as HTMLElement).closest("button")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current.lastT = e.timeStamp;
    gesture.current.moved = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !live) return;
    const holder = holderRef.current;
    if (!holder) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (gesture.current.pinch > 0 && d > 0) {
        zoomBy(motion.current, d / gesture.current.pinch, now());
        reportZoom("pinch");
      }
      gesture.current.pinch = d;
      kick.current();
      return;
    }
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    const dt = e.timeStamp - gesture.current.lastT;
    gesture.current.lastT = e.timeStamp;
    gesture.current.moved += Math.abs(dx) + Math.abs(dy);
    dragBy(motion.current, dx, dy, holder.clientWidth, dt, e.pointerType !== "touch", now());
    if (gesture.current.moved > 4) reportDrag(e.pointerType);
    kick.current();
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      release(motion.current, opts(), now());
      setDragging(false);
      kick.current();
    } else if (pointers.current.size === 1) {
      gesture.current.pinch = 0;
    }
  }

  // Zoom with ctrl or cmd plus the wheel (a trackpad pinch arrives the same way). A plain wheel
  // is left alone so the page keeps scrolling. A native listener, because React's is passive.
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || !live) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomBy(motion.current, Math.exp(-e.deltaY * 0.0025), now());
      reportZoom("wheel");
      kick.current();
    };
    holder.addEventListener("wheel", onWheel, { passive: false });
    return () => holder.removeEventListener("wheel", onWheel);
  }, [live, reportZoom]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) {
      if (e.key === "Escape" && open) closeCard();
      return;
    }
    const m = motion.current;
    const t = now();
    let handled = true;
    if (e.key === "Escape" && open) closeCard();
    else if (!live) handled = false;
    else if (e.key === "ArrowLeft") nudge(m, -KEY_STEP, 0, t);
    else if (e.key === "ArrowRight") nudge(m, KEY_STEP, 0, t);
    else if (e.key === "ArrowUp") nudge(m, 0, -KEY_STEP, t);
    else if (e.key === "ArrowDown") nudge(m, 0, KEY_STEP, t);
    else if (e.key === "+" || e.key === "=") zoomBy(m, 1.25, t);
    else if (e.key === "-" || e.key === "_") zoomBy(m, 0.8, t);
    else if (e.key === "0" || e.key === "Home") resetTo(m, HOME, opts(), t);
    else handled = false;
    if (!handled) return;
    e.preventDefault();
    if (e.key.startsWith("Arrow")) reportDrag("keyboard");
    if (["+", "=", "-", "_"].includes(e.key)) reportZoom("keyboard");
    kick.current();
  }

  const zoom = (factor: number) => {
    zoomBy(motion.current, factor, now());
    reportZoom("button");
    kick.current();
  };
  const reset = () => {
    resetTo(motion.current, HOME, opts(), now());
    kick.current();
  };

  function openCard(id: string, el: HTMLButtonElement, input: Input) {
    lastMarker.current = el;
    cardOpen.current = true;
    refreshPause();
    setOpen(id);
    // Turn the globe so the marker sits in the upper part, clear of the card below it.
    const r = receipts.find((x) => x.id === id);
    if (live && r) {
      const at = centerOn(r.marker.lat, r.marker.lng, motion.current.scale);
      resetTo(motion.current, { ...at, theta: at.theta - 0.6 }, opts(), now());
      kick.current();
    }
    track("marker_opened", { receipt_id: id, input });
  }
  function closeCard() {
    cardOpen.current = false;
    refreshPause();
    setOpen(null);
    lastMarker.current?.focus();
  }

  // Move focus into the card when it opens, so a keyboard or screen reader user lands on it.
  useEffect(() => {
    if (open) cardRef.current?.focus();
  }, [open]);

  const current = receipts.find((r) => r.id === open) ?? null;
  const canAsk = canGL && !live && hold !== null;
  const hintId = "globe-hint";

  return (
    <div className="stage">
      {/* biome-ignore lint/a11y/useSemanticElements: a focusable group is the right role for a custom control surface */}
      <div
        className={`globe-holder${dragging ? " is-dragging" : ""}${live ? "" : " is-static"}`}
        ref={holderRef}
        role="group"
        aria-label="Interactive globe of the first three questions"
        aria-describedby={hintId}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the globe takes arrow keys and + and - when focused
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          hovering.current = true;
          refreshPause();
        }}
        onPointerLeave={() => {
          hovering.current = false;
          refreshPause();
        }}
        onFocus={() => {
          focused.current = true;
          refreshPause();
        }}
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          focused.current = false;
          refreshPause();
        }}
        onKeyDown={onKeyDown}
      >
        <img
          className="globe-poster"
          src="/globe-poster.svg"
          width={420}
          height={420}
          alt="A dot-sampled globe of the world, marking where the first tracked events will resolve."
          fetchPriority="high"
          draggable={false}
        />
        <canvas className={`globe-canvas${ready ? " ready" : ""}`} ref={canvasRef} />
        {receipts.map((r, i) => (
          <button
            type="button"
            hidden
            key={r.id}
            ref={(el) => {
              markerRefs.current[i] = el;
            }}
            className="globe-marker"
            aria-label={`Open the receipt for the ${r.short}`}
            aria-expanded={open === r.id}
            aria-controls={open === r.id ? "globe-card" : undefined}
            onClick={(e) =>
              openCard(r.id, e.currentTarget, e.detail === 0 ? "keyboard" : "pointer")
            }
          >
            <span className="globe-marker-label">{r.short}</span>
          </button>
        ))}
        {live ? (
          <div className="globe-controls">
            <button
              type="button"
              className="globe-control"
              aria-label="Zoom in"
              onClick={() => zoom(1.25)}
            >
              +
            </button>
            <button
              type="button"
              className="globe-control"
              aria-label="Zoom out"
              onClick={() => zoom(0.8)}
            >
              −
            </button>
            <button
              type="button"
              className="globe-control globe-control-text"
              aria-label="Reset the view"
              onClick={reset}
            >
              Reset
            </button>
          </div>
        ) : null}
        {current ? (
          <div className="receipt-wrap globe-card" id="globe-card" ref={cardRef} tabIndex={-1}>
            <Receipt receipt={current}>
              <div className="globe-card-actions">
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    cardOpen.current = false;
                    refreshPause();
                    setOpen(null);
                    onJoin("globe_card");
                  }}
                >
                  Make your call
                </button>
                <button type="button" className="link" onClick={closeCard}>
                  Close
                </button>
              </div>
            </Receipt>
          </div>
        ) : null}
      </div>
      <p className="globe-hint" id={hintId}>
        {live
          ? "Drag to turn the globe. Open a marker to see its question."
          : "Open a marker to see its question. All three are listed below."}
      </p>
      {canAsk ? (
        <button
          type="button"
          className="link globe-enable"
          onClick={() => {
            setHold(null);
            setWanted(true);
          }}
        >
          Make the globe interactive
        </button>
      ) : null}
    </div>
  );
}
