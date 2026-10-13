import { connect } from "../_lib/db";
import type { Env } from "../_lib/env";
import { handleSignup } from "../_lib/signup";

export const onRequestPost: PagesFunction<Env> = ({ request, env, waitUntil }) =>
  handleSignup(
    request,
    env,
    { db: connect(env.DATABASE_URL), fetch, now: () => new Date() },
    waitUntil,
  );
