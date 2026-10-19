import assert from "node:assert/strict";
import test from "node:test";
import { setOneXZoom } from "../lib/camera-zoom.js";

test("camera zoom requests 1x and preserves facing constraints", async () => {
  let zoom = 0.5;
  let applied;
  const track = {
    getCapabilities: () => ({ zoom: { min: 0.5, max: 5 } }),
    getSettings: () => ({ zoom }),
    getConstraints: () => ({ facingMode: { exact: "environment" }, resizeMode: "none" }),
    applyConstraints: async constraints => { applied = constraints; zoom = constraints.zoom.exact; },
  };
  assert.equal(await setOneXZoom(track), true);
  assert.deepEqual(applied, { facingMode: { exact: "environment" }, resizeMode: "none", zoom: { exact: 1 } });
});

test("unsupported zoom leaves the camera available", async () => {
  let called = false;
  const track = {
    getCapabilities: () => ({ zoom: { min: 2, max: 5 } }),
    applyConstraints: async () => { called = true; },
  };
  assert.equal(await setOneXZoom(track), false);
  assert.equal(called, false);
});
