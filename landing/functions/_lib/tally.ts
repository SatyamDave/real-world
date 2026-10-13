import { sendEvent } from "./amplitude";
import { type Deps, type Env, json } from "./env";
import { sha256Hex, verifyTallySignature } from "./signature";

const MAX_BODY = 64 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The shape Tally documents for a FORM_RESPONSE webhook (https://tally.so/help/webhooks):
// every answer is an entry in data.fields with a stable `key`, a `label` (the question
// title, or the hidden field's name), a `type` and a `value`. Choice answers carry the
// chosen option ids in `value` and the full list in `options`.
interface Field {
  key?: string;
  label?: string;
  type?: string;
  value?: unknown;
  options?: { id?: string; text?: string }[];
}
interface TallyPayload {
  eventId?: string;
  eventType?: string;
  data?: { responseId?: string; formId?: string; fields?: Field[] };
}

function hidden(fields: Field[], name: string): string | undefined {
  const f = fields.find((x) => x.type === "HIDDEN_FIELDS" && x.label === name);
  return typeof f?.value === "string" ? f.value : undefined;
}

// Answers are found by type, not by question title, so editing a question's wording in
// Tally cannot break the join. The form has exactly one number question and one choice
// question (landing/tally/FORM_SPEC.md).
function forecast(fields: Field[]): number | null {
  const v = fields.find((x) => x.type === "INPUT_NUMBER")?.value;
  return typeof v === "number" && v >= 0 && v <= 100 ? v / 100 : null;
}

function role(fields: Field[]): string | null {
  const f = fields.find((x) => x.type === "MULTIPLE_CHOICE");
  if (!f) return null;
  const picked = Array.isArray(f.value) ? f.value[0] : f.value;
  if (typeof picked !== "string") return null;
  const text = f.options?.find((o) => o.id === picked)?.text;
  return (text ?? picked).slice(0, 100);
}

// POST /api/tally. The raw request is logged first, even when the signature is wrong,
// so nothing is lost; only a valid signature updates a signup. The table is still named
// typeform_events (the schema was built for the first form vendor and is not worth a
// production migration): it holds Tally events now, and typeform_response_id holds
// Tally's responseId.
export async function handleTally(
  request: Request,
  env: Env,
  deps: Deps,
  waitUntil: (p: Promise<unknown>) => void = () => {},
): Promise<Response> {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);

  const valid = await verifyTallySignature(
    env.TALLY_SIGNING_SECRET ?? "",
    raw,
    request.headers.get("Tally-Signature"),
  );

  let payload: TallyPayload | null = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = null;
  }

  // The first completed answer for a signup wins, so knowing someone's signup id (the
  // duplicate-email response returns it) cannot overwrite their answers. A valid event is
  // keyed by Tally's event id, so a replay or one of Tally's retries conflicts and is
  // ignored; a retry that arrives under a new event id for the same response is stopped by
  // the first-answer rule. An invalid one is keyed by a body hash so a forger cannot claim
  // a real event id and block the genuine delivery.
  const bodyHash = (await sha256Hex(raw)).slice(0, 32);
  const eventId = valid && payload?.eventId ? String(payload.eventId) : `unverified:${bodyHash}`;

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
  if (payload?.eventType !== "FORM_RESPONSE") return json({ ok: true, ignored: true });

  const fields = payload.data?.fields ?? [];
  const signupId = hidden(fields, "signup_id");
  if (!signupId || !UUID.test(signupId)) return json({ ok: true, matched: false });

  const chosenRole = role(fields);
  const probability = forecast(fields);
  const questionId = hidden(fields, "question_id")?.slice(0, 100) ?? null;

  const updated = await deps.db(
    `UPDATE waitlist_signups
        SET typeform_response_id = $2, role = $3, forecast_question_id = $4,
            forecast_probability = $5, completed_at = now()
      WHERE id = $1 AND completed_at IS NULL
      RETURNING id, amplitude_device_id, headline_variant`,
    [signupId, payload.data?.responseId ?? null, chosenRole, questionId, probability],
  );
  if (updated.length === 0) return json({ ok: true, matched: false });

  const row = updated[0];
  waitUntil(
    sendEvent(
      env.AMPLITUDE_API_KEY,
      {
        event_type: "waitlist_completed",
        insert_id: `tally:${eventId}`,
        signup_id: signupId,
        device_id: (row.amplitude_device_id as string | null) ?? null,
        headline_variant: (row.headline_variant as string | null) ?? null,
        props: { role: chosenRole },
      },
      deps.fetch,
      deps.now(),
      env.ENVIRONMENT,
    ),
  );
  return json({ ok: true, matched: true });
}
