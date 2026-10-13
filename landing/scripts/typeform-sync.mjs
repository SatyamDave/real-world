#!/usr/bin/env node
// Creates or updates the waitlist Typeform from typeform/form.json (form as code),
// and optionally points its webhook at a deployment.
//
//   node scripts/typeform-sync.mjs                         create or update the form
//   node scripts/typeform-sync.mjs --webhook-url <url>     also set the webhook (the /api/typeform URL)
//   add --env production to work on the production form, a second form kept in
//   typeform/form-id.production.txt, so staging submissions never reach the production webhook
//
// Reads TYPEFORM_TOKEN and TYPEFORM_WEBHOOK_SECRET from the environment or .dev.vars.
// The form id is stored in typeform/form-id.txt (not a secret). Secrets are never printed.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://api.typeform.com";

function devVars() {
  const path = join(root, ".dev.vars");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const vars = { ...devVars(), ...process.env };
const token = vars.TYPEFORM_TOKEN;
if (!token) {
  console.error("TYPEFORM_TOKEN is not set");
  process.exit(1);
}

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
    process.exit(1);
  }
  return text ? JSON.parse(text) : {};
}

const form = JSON.parse(readFileSync(join(root, "typeform/form.json"), "utf8"));
const envFlag = process.argv.indexOf("--env");
const target = envFlag > 0 ? process.argv[envFlag + 1] : "staging";
if (!["staging", "production"].includes(target)) {
  console.error("--env must be staging or production");
  process.exit(1);
}
const idFile = join(
  root,
  target === "production" ? "typeform/form-id.production.txt" : "typeform/form-id.txt",
);
let id = existsSync(idFile) ? readFileSync(idFile, "utf8").trim() : "";

if (id) {
  await call("PUT", `/forms/${id}`, form);
  console.log(`updated form ${id}`);
} else {
  const created = await call("POST", "/forms", form);
  id = created.id;
  writeFileSync(idFile, `${id}\n`);
  console.log(`created form ${id} (saved to ${idFile.replace(`${root}/`, "")})`);
}

const i = process.argv.indexOf("--webhook-url");
if (i !== -1) {
  const url = process.argv[i + 1];
  if (!url?.startsWith("https://")) {
    console.error("--webhook-url must be an https URL");
    process.exit(1);
  }
  if (!vars.TYPEFORM_WEBHOOK_SECRET) {
    console.error("TYPEFORM_WEBHOOK_SECRET is not set");
    process.exit(1);
  }
  await call("PUT", `/forms/${id}/webhooks/landing`, {
    url,
    enabled: true,
    secret: vars.TYPEFORM_WEBHOOK_SECRET,
    verify_ssl: true,
  });
  console.log(`webhook "landing" -> ${url}`);
}
