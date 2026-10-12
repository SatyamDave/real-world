import { type RefObject, useEffect } from "react";
import { track } from "./analytics";

/** Fires section_viewed once, the first time at least 40% of the section is on screen. */
export function useViewed(ref: RefObject<Element | null>, section: string): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        track("section_viewed", { section });
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, section]);
}
