import assert from "node:assert/strict";
import test from "node:test";
import { personAlpha } from "../lib/background.js";

test("uncertain mask edges are soft while confident people and scenery stay separate", () => {
  assert.equal(personAlpha(0), 0);
  assert.equal(personAlpha(.2), 0);
  assert.equal(personAlpha(.5), 128);
  assert.equal(personAlpha(.8), 255);
  assert.equal(personAlpha(1), 255);
  const ramp = Array.from({ length: 101 }, (_, i) => personAlpha(i / 100));
  assert.ok(ramp.every((value, i) => value >= (ramp[i - 1] ?? 0)));
});
