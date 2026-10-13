// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignupError, SignupForm, type SignupResult, type SubmitFn } from "./SignupForm";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
beforeEach(() => {
  container = document.body.appendChild(document.createElement("div"));
});
afterEach(() => {
  container.remove();
  vi.clearAllMocks();
});

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));
const until = (check: () => void) =>
  vi.waitFor(async () => {
    await flush();
    check();
  });

async function render(node: React.ReactNode) {
  await act(async () => createRoot(container).render(node));
  await flush();
}

function need<T>(value: T | null | undefined, what: string): T {
  if (value == null) throw new Error(`missing ${what}`);
  return value;
}

function type(value: string) {
  const input = need(container.querySelector<HTMLInputElement>("input"), "email input");
  const setter = need(
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set,
    "value setter",
  );
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function submit() {
  const form = need(container.querySelector("form"), "form");
  await act(async () => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await flush();
}

test("an invalid email shows the invalid-email message and does not submit", async () => {
  const fn = vi.fn();
  await render(<SignupForm location="test" submit={fn as unknown as SubmitFn} />);
  type("not-an-email");
  await submit();
  expect(container.textContent).toContain("Enter an email address like you@email.com.");
  expect(fn).not.toHaveBeenCalled();
});

test("a valid email goes loading then success, and submits the trimmed email", async () => {
  const fn: SubmitFn = vi.fn(
    () =>
      new Promise<SignupResult>((r) =>
        setTimeout(() => r({ signupId: "s1", duplicate: false }), 5),
      ),
  );
  await render(<SignupForm location="test" submit={fn} />);
  type("  You@Email.com  ");
  await submit();
  // success state
  await until(() => expect(container.textContent).toContain("You're in."));
  expect(fn).toHaveBeenCalledTimes(1);
  const arg = (fn as unknown as { mock: { calls: [{ email: string; consentVersion: string }][] } })
    .mock.calls[0][0];
  expect(arg.email).toBe("You@Email.com");
  expect(arg.consentVersion).toBe("2026-10-12");
  // teaser question appears in the embedded form slot
  expect(container.textContent).toContain("Federal Reserve");
});

test("a duplicate email shows the already-on-the-list state", async () => {
  const fn: SubmitFn = vi.fn(async () => ({ signupId: "s2", duplicate: true }));
  await render(<SignupForm location="test" submit={fn} />);
  type("dup@email.com");
  await submit();
  await until(() => expect(container.textContent).toContain("You're already on the list."));
});

test("a failed request shows the error state", async () => {
  const fn: SubmitFn = vi.fn(async () => {
    throw new Error("network");
  });
  await render(<SignupForm location="test" submit={fn} />);
  type("ok@email.com");
  await submit();
  await until(() =>
    expect(container.textContent).toContain("That didn't save. Check your connection"),
  );
});

test("a failed bot check and a rate limit each say what to do", async () => {
  for (const [reason, text] of [
    ["bot_check", "Reload the page and try again."],
    ["rate_limited", "Wait a few minutes and try again."],
  ] as const) {
    container.remove();
    container = document.body.appendChild(document.createElement("div"));
    const fn: SubmitFn = vi.fn(async () => {
      throw new SignupError(reason);
    });
    await render(<SignupForm location="test" submit={fn} />);
    type("ok@email.com");
    await submit();
    await until(() => expect(container.textContent).toContain(text));
  }
});

test("success moves focus to the result, and an error is tied to the email field", async () => {
  const ok: SubmitFn = vi.fn(async () => ({ signupId: "s1", duplicate: false }));
  await render(<SignupForm location="test" submit={ok} />);
  type("ok@email.com");
  await submit();
  await until(() => expect(document.activeElement?.tagName).toBe("H2"));
  expect(document.activeElement?.textContent).toContain("You're in.");

  container.remove();
  container = document.body.appendChild(document.createElement("div"));
  await render(<SignupForm location="test" submit={ok} />);
  type("not-an-email");
  await submit();
  const input = need(container.querySelector("input"), "email input");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  const msg = need(container.querySelector("#email-msg"), "error message");
  expect(input.getAttribute("aria-describedby")).toBe(msg.id);
});
