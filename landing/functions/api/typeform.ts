import { connect } from "../_lib/db";
import type { Env } from "../_lib/env";
import { handleTypeform } from "../_lib/typeform";

export const onRequestPost: PagesFunction<Env> = ({ request, env, waitUntil }) =>
  handleTypeform(
    request,
    env,
    { db: connect(env.DATABASE_URL), fetch, now: () => new Date() },
    waitUntil,
  );
