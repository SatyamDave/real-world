import { type RefObject, useEffect } from "react";
import { track } from "./analytics";

/** Fires section_viewed once, the first time at least 40% of the section is on screen. */
export function useViewed(ref: RefObject<Element | null>, section: string): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The pointer tracker finds sections by this attribute (src/sectionTracker.ts).
    if (el instanceof HTMLElement) el.dataset.section = section;
    if (typeof IntersectionObserver === "undefined") return;
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
