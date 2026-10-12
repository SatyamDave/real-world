# engine/tests/data

- `gkg-20261011120000.csv.zip`: twelve rows of the GDELT GKG 2.1 file for the 2026-10-11 12:00 UTC slot, copied unchanged from `https://data.gdeltproject.org/gdeltv2/20261011120000.gkg.csv.zip` on 2026-10-12. Ten rows yield a base country and a kept theme; two do not. Source: The GDELT Project, https://www.gdeltproject.org/ ([research/data/050](../../../research/data/050-gdelt.md)).
- Real replies to `python -m rw.ledger anchor` for the day in [data/fixtures/receipts_test_vector.json](../../../data/fixtures/receipts_test_vector.json) (record hash `fbd9a9df6b361e47745af74e86dc3d3a41d85b45c906ca05f5e2533f465367f5`), recorded on 2026-10-12. That fixture record hash is the only value sent.
  - `freetsa_2026-10-01.tsr`: the TimeStampResp from `https://freetsa.org/tsr`. Inspect with `openssl ts -reply -in freetsa_2026-10-01.tsr -text`.
  - `ots_2026-10-01.bin`: the pending timestamp from `https://a.pool.opentimestamps.org/digest`.
  Tests replay these; `RW_LIVE_TESTS=1 uv run pytest engine/tests/test_ledger.py -k live` calls the services again.
