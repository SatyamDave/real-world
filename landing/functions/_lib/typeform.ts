import { sendEvent } from "./amplitude";
import { type Deps, type Env, json } from "./env";
import { sha256Hex, verifyTypeformSignature } from "./signature";

const MAX_BODY = 64 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Answer {
  field?: { ref?: string };
  type?: string;
  number?: number;
  choice?: { label?: string };
}
interface FormResponse {
  token?: string;
  hidden?: Record<string, string>;
  answers?: Answer[];
}

function byRef(answers: Answer[] | undefined, ref: string): Answer | undefined {
  return answers?.find((a) => a.field?.ref === ref);
}

// POST /api/typeform. The raw request is logged first, even when the signature
// is wrong, so nothing is lost; only a valid signature updates a signup.
export async function handleTypeform(
  request: Request,
  env: Env,
  deps: Deps,
  waitUntil: (p: Promise<unknown>) => void = () => {},
): Promise<Response> {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);

  const valid = await verifyTypeformSignature(
    env.TYPEFORM_WEBHOOK_SECRET ?? "",
    raw,
    request.headers.get("Typeform-Signature"),
  );

  let payload: { event_id?: string; form_response?: FormResponse } | null = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = null;
  }

  // The first completed answer for a signup wins, so knowing someone's signup id
  // (the duplicate-email response returns it) cannot overwrite their answers.
  // A valid event is keyed by Typeform's event id, so a replay conflicts and is
  // ignored. An invalid one is keyed by a body hash so a forger cannot claim a
  // real event id and block the genuine delivery.
  const bodyHash = (await sha256Hex(raw)).slice(0, 32);
  const eventId = valid && payload?.event_id ? payload.event_id : `unverified:${bodyHash}`;

  const logged = await deps.db(
    `INSERT INTO typeform_events (id, signature_valid, payload) VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (id) DO NOTHING RETURNING id`,
    // An unverified body is untrusted and unbounded in intent: keep metadata, not content.
    [
      eventId,
      valid,
      JSON.stringify(valid && payload ? payload : { unverified: true, bytes: raw.length }),
    ],
  );

  if (!valid) return json({ error: "invalid_signature" }, 401);
  if (logged.length === 0) return json({ ok: true, replay: true });

  const fr = payload?.form_response;
  const signupId = fr?.hidden?.signup_id;
  if (!fr || !signupId || !UUID.test(signupId)) return json({ ok: true, matched: false });

  const role = byRef(fr.answers, "role")?.choice?.label ?? null;
  const pct = byRef(fr.answers, "forecast_probability")?.number;
  const probability = typeof pct === "number" && pct >= 0 && pct <= 100 ? pct / 100 : null;
  const questionId = fr.hidden?.question_id?.slice(0, 100) ?? null;

  const updated = await deps.db(
    `UPDATE waitlist_signups
        SET typeform_response_id = $2, role = $3, forecast_question_id = $4,
            forecast_probability = $5, completed_at = now()
      WHERE id = $1 AND completed_at IS NULL
      RETURNING id, amplitude_device_id, headline_variant`,
    [signupId, fr.token ?? null, role, questionId, probability],
  );
  if (updated.length === 0) return json({ ok: true, matched: false });

  const row = updated[0];
  waitUntil(
    sendEvent(
      env.AMPLITUDE_API_KEY,
      {
        event_type: "waitlist_completed",
        insert_id: `typeform:${eventId}`,
        signup_id: signupId,
        device_id: (row.amplitude_device_id as string | null) ?? null,
        headline_variant: (row.headline_variant as string | null) ?? null,
        props: { role },
      },
      deps.fetch,
      deps.now(),
      env.ENVIRONMENT,
    ),
  );
  return json({ ok: true, matched: true });
}
