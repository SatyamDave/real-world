import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react";

const KEY = "rw.tab.";
const stored = (surface: string) => {
  try {
    return localStorage.getItem(KEY + surface);
  } catch {
    return null;
  }
};

/** Underline tabs with arrow-key navigation; the chosen tab persists per `surface`. `end` sits at the right of the tab row. */
export function Tabs({
  surface,
  label,
  tabs,
  end,
  children,
}: {
  surface: string;
  label: string;
  tabs: { id: string; label: string }[];
  end?: (active: string) => ReactNode;
  children: (active: string) => ReactNode;
}) {
  const uid = useId();
  const [chosen, choose] = useState(() => stored(surface));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = tabs.find((t) => t.id === chosen)?.id ?? tabs[0].id;
  const pick = (i: number) => {
    const id = tabs[i].id;
    choose(id);
    try {
      localStorage.setItem(KEY + surface, id);
    } catch {}
    refs.current[i]?.focus();
  };
  const onKey = (e: KeyboardEvent, i: number) => {
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    pick((to + tabs.length) % tabs.length);
  };
  return (
    <div className="tabs">
      <div className="tabs-row">
        <div role="tablist" aria-label={label}>
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-${t.id}`}
              aria-selected={t.id === active}
              aria-controls={`${uid}-panel`}
              tabIndex={t.id === active ? 0 : -1}
              onClick={() => pick(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {end?.(active)}
      </div>
      <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-${active}`}>
        {children(active)}
      </div>
    </div>
  );
}
