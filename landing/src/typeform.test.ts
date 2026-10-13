import { expect, test } from "vitest";
import form from "../typeform/form.json";
import { BRAND } from "./brand";

// The webhook handler reads answers by ref and hidden fields by name; the embed
// sends the hidden fields. This test keeps the form definition and both in step.
test("form.json matches the webhook handler and the embed", () => {
  const refs = form.fields.map((f) => f.ref);
  expect(refs).toEqual(["forecast_probability", "role"]);
  expect(form.hidden).toEqual(["signup_id", "device_id", "variant", "question_id"]);
  expect(form.fields[0].title).toBe(BRAND.teaser.question);
  expect(form.fields[0].validations).toMatchObject({ min_value: 0, max_value: 100 });
  expect(JSON.stringify(form)).not.toContain(BRAND.name);
});
