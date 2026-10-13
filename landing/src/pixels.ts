// Ad pixels, loaded after first paint and only when their id is configured.
// Each id comes from a VITE_* variable; with none set nothing loads. Meta has no
// code here: it stays off until the policy review clears (landing/RUNBOOK.md).
// Call shapes follow the vendors' base-code snippets as described in secondary
// sources; they are not yet verified against a live pixel (see the runbook).

type Fn = ((...args: unknown[]) => void) & { queue?: unknown[]; callQueue?: unknown[] };
declare global {
  interface Window {
    rdt?: Fn;
    twq?: Fn;
  }
}

function addScript(src: string): void {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

export function loadReddit(pixelId: string): void {
  if (window.rdt) return;
  const queue: unknown[] = [];
  const rdt: Fn = (...args) => {
    queue.push(args);
  };
  rdt.callQueue = queue;
  window.rdt = rdt;
  addScript("https://www.redditstatic.com/ads/pixel.js");
  rdt("init", pixelId);
  rdt("track", "PageVisit");
}

export function loadX(pixelId: string): void {
  if (window.twq) return;
  const queue: unknown[] = [];
  const twq: Fn = (...args) => {
    queue.push(args);
  };
  twq.queue = queue;
  window.twq = twq;
  addScript("https://static.ads-twitter.com/uwt.js");
  twq("config", pixelId);
}

/** A saved signup is the one conversion. `eventId` is the signup id, so a future server-side call can dedupe against it. */
export function sendLead(eventId: string, xLeadEventId: string): void {
  window.rdt?.("track", "Lead", { conversionId: eventId });
  if (xLeadEventId) window.twq?.("event", xLeadEventId, { conversion_id: eventId });
}
