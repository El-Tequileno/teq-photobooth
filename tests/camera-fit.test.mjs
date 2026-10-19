import assert from "node:assert/strict";
import test from "node:test";
import { fittedVideoRect } from "../lib/camera-fit.js";

test("phone framing contains the full image while desktop cover keeps filling the frame", () => {
  const phone = fittedVideoRect(1280, 720, 1080, 1620, "contain");
  assert.deepEqual(phone, { x: 0, y: 506.25, width: 1080, height: 607.5 });
  const desktop = fittedVideoRect(1280, 720, 1080, 1620, "cover");
  assert.deepEqual(desktop, { x: -900, y: 0, width: 2880, height: 1620 });
  const portrait = fittedVideoRect(720, 1080, 1080, 1620, "contain");
  assert.deepEqual(portrait, { x: 0, y: 0, width: 1080, height: 1620 });
});
