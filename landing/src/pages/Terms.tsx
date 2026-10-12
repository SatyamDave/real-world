import { BRAND } from "../brand";

// Minimal draft placeholder. Full terms are written in PR5.
export function Terms() {
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
      <h1 style={{ marginBottom: 12 }}>Terms</h1>
      <p style={{ color: "var(--muted)" }}>
        {BRAND.name} is a pre-launch waitlist. Outputs shown anywhere on this site are AI-simulated
        and are not polls or predictions about real people. Full terms are published before launch.
      </p>
    </article>
  );
}
