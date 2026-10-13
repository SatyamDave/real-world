import { connect } from "../_lib/db";
import type { Env } from "../_lib/env";
import { handleTally } from "../_lib/tally";

export const onRequestPost: PagesFunction<Env> = ({ request, env, waitUntil }) =>
  handleTally(
    request,
    env,
    { db: connect(env.DATABASE_URL), fetch, now: () => new Date() },
    waitUntil,
  );
