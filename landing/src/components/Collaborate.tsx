import { useRef } from "react";
import { track } from "../analytics";
import { BRAND } from "../brand";
import { COLLABORATE } from "../copy/sections";
import { useViewed } from "../useViewed";

// Contact only: no partner names, no form of its own. The waitlist stays the one dominant
// call to action, so until a contact address exists this points back at it.
export function Collaborate({ onJoin }: { onJoin: () => void }) {
  const viewRef = useRef<HTMLElement>(null);
  useViewed(viewRef, "collaborate");
  const contact = BRAND.contactEmail.trim();
  return (
    <section ref={viewRef} className="section wrap collab" aria-labelledby="collab-title">
      <div>
        <h2 className="section-title" id="collab-title">
          {COLLABORATE.title}
        </h2>
        <p className="section-note">{COLLABORATE.body}</p>
      </div>
      {contact ? (
        <a
          className="collab-link"
          href={`mailto:${contact}`}
          onClick={() => track("outbound_clicked", { to: "collaboration" })}
        >
          {COLLABORATE.withEmail}
        </a>
      ) : (
        <button type="button" className="collab-link" onClick={onJoin}>
          {COLLABORATE.withoutEmail}
        </button>
      )}
    </section>
  );
}
