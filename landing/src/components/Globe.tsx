import { useEffect, useRef, useState } from "react";
import { track } from "../analytics";

export interface Marker {
  lat: number;
  lng: number;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

// Event pulses: each tracked event's marker swells once, in turn, after the globe
// appears, then settles. Nothing else on the page animates by itself.
const BASE_SIZE = 0.05;
const PULSE_PEAK = 0.065;
const PULSE_START_MS = 600;
const PULSE_STAGGER_MS = 900;
const PULSE_LENGTH_MS = 1600;

export function pulseSize(i: number, elapsedMs: number): number {
  const local = elapsedMs - PULSE_START_MS - i * PULSE_STAGGER_MS;
  if (local <= 0 || local >= PULSE_LENGTH_MS) return BASE_SIZE;
  return BASE_SIZE + PULSE_PEAK * Math.sin((Math.PI * local) / PULSE_LENGTH_MS);
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
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

/**
 * Dot-sampled globe. The static poster (Natural Earth, generated at build time)
 * is always rendered and is the sole visual for no-WebGL and reduced-motion
 * visitors. Otherwise cobe is lazy-imported after first paint and fades in over
 * the poster. Rendering is torn down when the globe is off-screen or the tab is
 * hidden, and recreated when it returns.
 */
export type GlobePhase = "pulsing" | "static";

export function Globe({
  markers = [],
  onPhase,
}: {
  markers?: Marker[];
  onPhase?: (phase: GlobePhase) => void;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const announcedRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the globe is initialised once; markers and onPhase are stable for the page's life
  useEffect(() => {
    const canvas = canvasRef.current;
    const holder = holderRef.current;
    if (!canvas || !holder) return;

    if (prefersReducedMotion() || !hasWebGL()) {
      onPhase?.("static");
      return; // poster only
    }

    let destroyed = false;
    let globe: { update: (s: Record<string, unknown>) => void; destroy: () => void } | null = null;
    let frame = 0;
    let phi = -0.6; // start near the Atlantic, matching the poster
    let onScreen = true;

    const render = () =>
      import("cobe").then(({ default: createGlobe }) => {
        if (destroyed || globe) return;
        const size = holder.clientWidth;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = size * dpr;
        globe = createGlobe(canvas, {
          devicePixelRatio: dpr,
          width: w,
          height: w,
          phi,
          theta: 0.22,
          dark: 0,
          diffuse: 0.9,
          mapSamples: 14000,
          mapBrightness: 1.25,
          baseColor: cssRgb01("--globe-dot", [0.18, 0.43, 0.3]),
          markerColor: cssRgb01("--accent-2", [0.7, 0.23, 0.18]),
          glowColor: cssRgb01("--paper", [0.95, 0.96, 0.95]),
          opacity: 0.95,
          markers: markers.map((m) => ({
            location: [m.lat, m.lng] as [number, number],
            size: BASE_SIZE,
          })),
        });
        // cobe v2 animates via update(); advance phi each frame while on screen.
        const started = performance.now();
        const pulseEnd = PULSE_START_MS + markers.length * PULSE_STAGGER_MS + PULSE_LENGTH_MS;
        let settled = announcedRef.current; // pulses play on the first render only
        const tick = () => {
          if (!globe) return;
          if (onScreen) phi += 0.0035;
          const elapsed = performance.now() - started;
          const pulsing = !settled && elapsed < pulseEnd + 50;
          if (!pulsing) settled = true;
          globe.update({
            phi,
            width: w,
            height: w,
            ...(pulsing
              ? {
                  markers: markers.map((m, i) => ({
                    location: [m.lat, m.lng] as [number, number],
                    size: pulseSize(i, elapsed),
                  })),
                }
              : {}),
          });
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        if (!announcedRef.current) {
          announcedRef.current = true;
          onPhase?.("pulsing");
          setReady(true);
          track("globe_ready", {});
        }
      });

    const stop = () => {
      cancelAnimationFrame(frame);
      globe?.destroy();
      globe = null;
    };

    // Start after first paint.
    const raf = requestAnimationFrame(() => {
      void render();
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (entry.isIntersecting && !document.hidden) void render();
        else stop();
      },
      { threshold: 0.05 },
    );
    io.observe(holder);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (onScreen) void render();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);

  return (
    <div className="globe-holder" ref={holderRef}>
      <img
        className="globe-poster"
        src="/globe-poster.svg"
        width={420}
        height={420}
        alt="A dot-sampled globe of the world, marking where the first tracked events will resolve."
        fetchPriority="high"
      />
      <canvas className={`globe-canvas${ready ? " ready" : ""}`} ref={canvasRef} />
    </div>
  );
}
