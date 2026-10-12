# Tamper-evident forecast receipts: commit-reveal and timestamping

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. The timestamp tools are documented first-hand on their own pages. The scheme design is my reasoning, not a tested system. The web search budget ran out, so I fetched primary pages directly and ran no broad survey.

## Answer

Use one daily Merkle root over salted forecast hashes. Publish the root in a public git repo, stamp it with OpenTimestamps (free, Bitcoin-anchored) and with one RFC 3161 token from a free TSA for an instant receipt. Skip Rekor for v1 and skip running any log of our own. That is about 100 lines of code, costs nothing, and anyone can verify it with OpenSSL and `ots`. It proves "this forecast existed before time T". It does not prove the forecast was good or made without hindsight.

## Findings

**OpenTimestamps (OTS).**
- Clients submit a digest to calendar servers. A calendar batches all digests into a Merkle tree and puts only the tip into a Bitcoin transaction. Each proof is the path from your hash to the block header. ([Todd announcement](https://petertodd.org/2016/opentimestamps-announcement))
- The calendar receipt comes back in about a second. Bitcoin confirmation takes at least about 10 minutes and often a few hours. `ots upgrade` later swaps the pending receipt for the full Bitcoin proof. ([Todd](https://petertodd.org/2016/opentimestamps-announcement), [client README](https://github.com/opentimestamps/opentimestamps-client))
- Trust sits in Bitcoin, not the calendars. A calendar that misbehaves can only stop upgrading your proof. The client stamps to several calendars by default. ([Todd](https://petertodd.org/2016/opentimestamps-announcement))
- The four default calendars (Alice, Bob, Finney, Catallaxy) are free, need no key, and run on donations. ([opentimestamps.org](https://opentimestamps.org/))
- Stamping needs no Bitcoin node. Verifying does; a pruned Bitcoin Core node is fine. ([client README](https://github.com/opentimestamps/opentimestamps-client))
- Client has 425 stars. Server (`otsd`) has 270. Both are LGPL-3.0. ([client](https://github.com/opentimestamps/opentimestamps-client), [server](https://github.com/opentimestamps/opentimestamps-server))
- Precision is coarse. Bitcoin block times are only accurate to an hour or two (a block may be stamped up to 2 hours ahead of network time). ([Bitcoin wiki](https://en.bitcoin.it/wiki/Block_timestamp)) Todd says almost certainly within a day.
- Todd is explicit that a timestamp only bounds when data could have changed. It cannot detect changes made before stamping. ([Todd](https://petertodd.org/2016/opentimestamps-announcement))

**RFC 3161 TSAs.**
- The client sends a hash. The TSA returns a signed token with the hash, a serial number and a time. The TSA is a trusted third party. ([RFC 3161](https://www.rfc-editor.org/rfc/rfc3161))
- If the TSA key leaks, every token it ever signed becomes doubtful, and keys expire, so old tokens may need re-stamping. ([RFC 3161](https://www.rfc-editor.org/rfc/rfc3161))
- FreeTSA is free, speaks plain HTTPS at `freetsa.org/tsr`, supports SHA-256 to SHA-512, and verifies with stock `openssl ts`. Its current certificate (P-384) covers stamps made from 2026-03-16 until February 2040. It states no SLA, no rate limit and no terms. ([FreeTSA](https://freetsa.org/index_en.php))

**Sigstore Rekor.**
- Rekor v1 is in maintenance mode. v2 ("rekor-tiles", Apache-2.0, 49 stars) is a tile-based log on Trillian-Tessera, announced GA on 2025-10-10. ([rekor](https://github.com/sigstore/rekor), [rekor-tiles](https://github.com/sigstore/rekor-tiles), [GA post](https://blog.sigstore.dev/rekor-v2-ga/))
- v2 accepts only `hashedrekord` and `dsse` entries. It dropped the `rfc3161` type and the signed timestamp it used to return. Witnessing was "will be implemented soon". ([GA post](https://blog.sigstore.dev/rekor-v2-ga/))
- The public instance targets 99.5% availability. The shard URL changes about every six months, and the post says not to hardcode it. v1 uploads are capped at 100 KB. ([rekor-tiles](https://github.com/sigstore/rekor-tiles), [rekor](https://github.com/sigstore/rekor))
- It is built for signed software artifacts. A forecast hash needs a signing key and a certificate flow it does not benefit from.

**Self-hosted logs and witnesses.**
- Tessera (Apache-2.0, 247 stars) builds tile logs with AWS, GCP or POSIX storage. It supports the C2SP witness protocol, where independent witnesses cosign a checkpoint only if it extends what they last saw. That is what blocks a split view. ([Tessera](https://github.com/transparency-dev/tessera), [C2SP witness](https://github.com/C2SP/C2SP/blob/main/tlog-witness.md))
- That is real machinery for a 22-day deadline, and it needs witnesses we do not have.

## What it means for Real World

- For the product: the receipts page can show, per day, the root, the git commit, the TSA token and the Bitcoin proof, plus a "verify this forecast" button that takes the revealed JSON and salt. "Cannot be backfilled" becomes a checkable claim rather than a slogan.
- For the engineering: the scheme (my design, not from a source):
  1. Leaf = SHA-256(`0x00` || question_id || canonical JSON of the forecast || 32-byte random salt). Canonical JSON means sorted keys and fixed number formatting.
  2. Salt is needed. Probabilities and question ids have very little entropy, so an unsalted hash can be guessed offline. Store salts in the private DB. Reveal them with the forecast after resolution.
  3. Daily root = Merkle root of the leaves, with `0x01` prefix on inner nodes. The day's record is `{date, root, leaf_count, prev_day_root, model_and_prompt_hash, question_list_hash}`. Chaining to the previous root and committing to the count and question list makes deleting or hiding bad forecasts visible.
  4. Publish the record as a file in a public git repo. Then `ots stamp` the record hash and POST the same hash to FreeTSA. Commit both proofs. Run `ots upgrade` on a cron until the Bitcoin attestation lands.
  5. Verification: recompute the leaf, check the Merkle path to the root, check the root against the record, then `openssl ts -verify` and `ots verify`.
- For the business: this is free to run. Cost is a cron job and a few kilobytes a day. The hours-long Bitcoin delay does not matter if questions resolve days later. It does matter for same-day questions, which is why the TSA token and git push are the interim receipts.

## Recommendations

1. Build the Merkle commit script with salted leaves and the day record above, plus a test that a modified forecast or a dropped leaf fails verification. One engineer, about a day.
2. Publish daily records to a public git repo (a separate `real-world-receipts` repo). Treat git as a convenience mirror, not as proof of time: commit dates are set by whoever commits.
3. Stamp every daily record hash with OTS and FreeTSA. Store the `.ots` and `.tsr` files next to the record. Run the upgrade cron daily.
4. Commit the question list before forecasting, not after, and publish the commit hash of the model, prompt and assimilation config with the same record.
5. Build the receipts page with a client-side verifier. Show pending versus Bitcoin-confirmed status honestly.
6. Skip Rekor and Tessera for now. Revisit a witnessed log only if we get outside parties willing to run witnesses.

## Open questions

- Is FreeTSA's lack of an SLA acceptable? A second TSA (a commercial one with a published policy) would remove the single point. We did not check commercial TSA pricing or terms.
- Are the four OTS calendars reliable enough for a daily stamp for years? An uptime monitor is linked from opentimestamps.org; we did not read its history. We should log upgrade failures and keep our own copy of every pending receipt.
- Should we also post each root somewhere with its own public clock (a social post, a second repo host)? Cheap, but we have not evaluated it.
- Does a hashed-forecast scheme leak anything through the leaf count or timing? Likely not much, but we did not model it.
- Exact Bitcoin transaction fees paid by the calendars are not published on the pages we read.

## Sources

- [OpenTimestamps home](https://opentimestamps.org/), accessed 2026-10-11
- [Peter Todd, OpenTimestamps announcement](https://petertodd.org/2016/opentimestamps-announcement), accessed 2026-10-11
- [opentimestamps-client](https://github.com/opentimestamps/opentimestamps-client), accessed 2026-10-11
- [opentimestamps-server](https://github.com/opentimestamps/opentimestamps-server), accessed 2026-10-11
- [Bitcoin wiki, Block timestamp](https://en.bitcoin.it/wiki/Block_timestamp), accessed 2026-10-11
- [RFC 3161](https://www.rfc-editor.org/rfc/rfc3161), accessed 2026-10-11
- [FreeTSA](https://freetsa.org/index_en.php), accessed 2026-10-11
- [sigstore/rekor](https://github.com/sigstore/rekor), accessed 2026-10-11
- [sigstore/rekor-tiles](https://github.com/sigstore/rekor-tiles), accessed 2026-10-11
- [Sigstore blog, Rekor v2 GA](https://blog.sigstore.dev/rekor-v2-ga/), accessed 2026-10-11
- [transparency-dev/tessera](https://github.com/transparency-dev/tessera), accessed 2026-10-11
- [C2SP tlog-witness](https://github.com/C2SP/C2SP/blob/main/tlog-witness.md), accessed 2026-10-11
