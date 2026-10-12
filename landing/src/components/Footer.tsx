import { track } from "../analytics";
import { BRAND } from "../brand";

export function Footer() {
  const contact = BRAND.contactEmail.trim();
  return (
    <footer className="site-footer wrap">
      <nav aria-label="Footer">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        {contact ? (
          <a
            href={`mailto:${contact}`}
            onClick={() => track("outbound_clicked", { to: "contact" })}
          >
            Contact
          </a>
        ) : null}
      </nav>
      <p className="disclosure">
        {BRAND.name} outputs are AI-simulated. Simulated populations are not polls and not
        predictions about real people.
      </p>
      <p>© 2026 {BRAND.name}.</p>
    </footer>
  );
}
