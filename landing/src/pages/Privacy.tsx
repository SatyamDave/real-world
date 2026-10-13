import { BRAND } from "../brand";

// Minimal draft placeholder. The full privacy policy (what we collect, the
// processors, purpose, retention, deletion on request, no sale, US-only) is
// written in PR5 (chore(landing): launch readiness).
export function Privacy() {
  return (
    <article>
      <p
        style={{
          background: "var(--paper-2)",
          padding: "10px 14px",
          borderRadius: "var(--radius)",
          marginBottom: 20,
          fontSize: 13.5,
        }}
      >
        Draft — reviewed by the founders before launch.
      </p>
      <h1 style={{ marginBottom: 12 }}>Privacy</h1>
      <p style={{ color: "var(--muted)" }}>
        {BRAND.name}'s full privacy policy is published before any ad runs. It will list what we
        collect, the processors we use, why we collect it, how long we keep it, how to ask for
        deletion, and that we do not sell data.
      </p>
    </article>
  );
}
