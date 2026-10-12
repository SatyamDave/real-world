import { expect, test } from "vitest";
import vector from "../../data/fixtures/receipts_test_vector.json";
import {
  type ChainDay,
  GENESIS_ROOT,
  leafHash,
  merkleRoot,
  recordHash,
  verifyChain,
} from "./verify";

const day = (): ChainDay => structuredClone(vector);

test("recomputes the shared test vector's leaves, root and record hash", async () => {
  for (const r of vector.entries) expect(await leafHash(r.entry, r.salt)).toBe(r.leaf_hash);
  expect(await merkleRoot(vector.entries.map((r) => r.leaf_hash))).toBe(vector.day.root);
  expect(await recordHash(vector.day)).toBe(vector.record_hash);
  expect(await verifyChain([day()])).toEqual({ [vector.day.date]: [] });
});

test("fails when one byte of an entry changes", async () => {
  const d = day();
  d.entries[1].entry.probability = "0.6251";
  const problems = (await verifyChain([d]))[vector.day.date];
  expect(problems).toContain("entry fx-2026-10-03-central-bank-cut sim: leaf hash does not match");
});

test("fails on a dropped leaf and on a broken chain link", async () => {
  const dropped = day();
  dropped.entries.pop();
  expect((await verifyChain([dropped]))[vector.day.date]).toContain(
    "Merkle root does not match the entries",
  );

  const relinked = day();
  relinked.day.prev_root = `1${GENESIS_ROOT.slice(1)}`;
  expect((await verifyChain([relinked]))[vector.day.date]).toContain(
    "previous root does not match the day before",
  );
});

test("odd leaf counts match rw.ledger.merkle_root", async () => {
  // sha256 of the single bytes 0x00..0x04; roots computed by the Python ledger.
  const leaves = [
    "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
    "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a",
    "dbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986",
    "084fed08b978af4d7d196a7446a86b58009e636b611db16211b65a9aadff29c5",
    "e52d9c508c502347344d8c07ad91cbd6068afc75ff6292f062a09ca381c89e71",
  ];
  expect(await merkleRoot(leaves.slice(0, 3))).toBe(
    "33f5525b7fee5018e5576f01d1ed1cadb43d7ae868bf814d56ad5a6c25ec633b",
  );
  expect(await merkleRoot(leaves)).toBe(
    "03156a7c81bdf6a8609cdad5ccc0592188fa49ff734eb7a66f963fd470ea4101",
  );
});
