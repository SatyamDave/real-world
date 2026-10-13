// Cookie-authenticated calls (product/accounts.md). The SDK leaves them out because they ride the
// session cookie, so this is the one module besides the SDK that calls fetch.
import {
  ApiError,
  type BacktestRequest,
  type BacktestResult,
  type Mark,
  type Person,
  type PostTestOut,
  type PostTestRequest,
  type SealedTest,
  type TestRecord,
} from "@real-world/sdk";
import { useLoad } from "./App";
import { API_URL } from "./api";

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!r.ok) throw new ApiError(r.status, data);
  return data as T;
}

export const account = {
  me: () => call<Person>("GET", "/v1/me"),
  email: (email: string) =>
    call<{ email: string; ttl_minutes: number }>("POST", "/v1/auth/email", { email }),
  verify: (body: { token: string } | { email: string; code: string }) =>
    call<Person>("POST", "/v1/auth/verify", body),
  signOut: (everywhere = false) =>
    call<null>("POST", `/v1/auth/sign-out${everywhere ? "?everywhere=true" : ""}`, {}),
  remove: () => call<null>("DELETE", "/v1/me", {}),
  test: (req: PostTestRequest) => call<PostTestOut>("POST", "/v1/tests", req),
  backtest: (req: BacktestRequest) => call<BacktestResult>("POST", "/v1/tests/backtest", req),
  tests: () => call<TestRecord>("GET", "/v1/me/tests"),
  mark: (id: string, outcome: Mark["outcome"]) =>
    call<SealedTest>("POST", `/v1/me/tests/${encodeURIComponent(id)}/outcome`, { outcome }),
};

/** The signed-in person, null when signed out; any other failure is an error. */
export function useSession() {
  return useLoad(() =>
    account.me().catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }),
  );
}

/** The path to return to after signing in. */
export const signInHref = (back = location.pathname) => `/sign-in?next=${encodeURIComponent(back)}`;

/** SHA-256 of a sealed test's stored body, in hex, to check its seal in the browser. */
export async function sealOf(body: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
